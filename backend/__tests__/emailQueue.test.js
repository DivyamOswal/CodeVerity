import { jest } from "@jest/globals";

// Control the email layer per-test. This overrides setup.js's
// resend mock entirely — emailQueue only calls sendInviteEmail.
const mockSendInviteEmail = jest.fn();

jest.unstable_mockModule("../utils/email.js", () => ({
  sendInviteEmail: mockSendInviteEmail,
}));

// Import AFTER the mock is registered.
const { default: EmailJob, MAX_ATTEMPTS } = await import(
  "../models/EmailJob.js"
);
const {
  processQueue,
  startEmailQueueWorker,
  stopEmailQueueWorker,
  getQueueStats,
} = await import("../services/emailQueue.js");

async function makeJob(overrides = {}) {
  return EmailJob.create({
    type: "invite",
    to: "invitee@example.com",
    payload: {
      workspaceName: "Acme",
      inviteLink: "https://app.example.com/invite/abc",
      role: "member",
    },
    status: "pending",
    attempts: 0,
    nextAttemptAt: new Date(Date.now() - 1000),
    ...overrides,
  });
}

beforeEach(() => {
  mockSendInviteEmail.mockReset();
  mockSendInviteEmail.mockResolvedValue({ id: "resend_abc123" });
});

afterEach(async () => {
  stopEmailQueueWorker();
  // Let any in-flight processQueue() (fired by startEmailQueueWorker)
  // finish and clear the module-level isProcessing flag.
  await new Promise((r) => setTimeout(r, 20));
});

/* ─── Model ─────────────────────────────────────────────── */

describe("EmailJob model", () => {
  it("creates a job with sane defaults", async () => {
    const job = await EmailJob.create({ type: "invite", to: "a@b.com" });
    expect(job.status).toBe("pending");
    expect(job.attempts).toBe(0);
    expect(job.nextAttemptAt).toBeInstanceOf(Date);
    expect(job.resendId).toBeNull();
    expect(job.lastError).toBeNull();
    expect(job.completedAt).toBeNull();
  });

  it("exposes MAX_ATTEMPTS = 6 (initial + 5 retries)", () => {
    expect(MAX_ATTEMPTS).toBe(6);
  });

  it("schedules the 1-minute retry after attempt 1", async () => {
    const job = await makeJob({ attempts: 1 });
    job.scheduleNextRetry();
    expect(job.status).toBe("pending");
    const delta = job.nextAttemptAt.getTime() - Date.now();
    expect(delta).toBeGreaterThanOrEqual(55_000);
    expect(delta).toBeLessThanOrEqual(65_000);
  });

  it("schedules the 6-hour retry after attempt 5", async () => {
    const job = await makeJob({ attempts: 5 });
    job.scheduleNextRetry();
    const delta = job.nextAttemptAt.getTime() - Date.now();
    const sixHours = 6 * 60 * 60 * 1000;
    expect(delta).toBeGreaterThanOrEqual(sixHours - 1000);
    expect(delta).toBeLessThanOrEqual(sixHours + 1000);
  });

  it("abandons when scheduled past the retry table", async () => {
    const job = await makeJob({ attempts: 6 });
    job.scheduleNextRetry();
    expect(job.status).toBe("abandoned");
    expect(job.completedAt).toBeInstanceOf(Date);
  });
});

/* ─── Happy path ────────────────────────────────────────── */

describe("processQueue — happy path", () => {
  it("sends a due job and marks it sent", async () => {
    const job = await makeJob();

    await processQueue();

    const fresh = await EmailJob.findById(job._id);
    expect(fresh.status).toBe("sent");
    expect(fresh.attempts).toBe(1);
    expect(fresh.resendId).toBe("resend_abc123");
    expect(fresh.completedAt).toBeInstanceOf(Date);
    expect(fresh.lastError).toBeNull();

    expect(mockSendInviteEmail).toHaveBeenCalledTimes(1);
    expect(mockSendInviteEmail).toHaveBeenCalledWith(
      "invitee@example.com",
      "Acme",
      "https://app.example.com/invite/abc",
      "member",
    );
  });

  it("skips jobs whose nextAttemptAt is in the future", async () => {
    await makeJob({ nextAttemptAt: new Date(Date.now() + 60_000) });
    await processQueue();
    expect(mockSendInviteEmail).not.toHaveBeenCalled();
    expect(await EmailJob.countDocuments({ status: "pending" })).toBe(1);
  });

  it("processes only due jobs when there are multiple", async () => {
    await makeJob({ to: "due@example.com" });
    await makeJob({
      to: "later@example.com",
      nextAttemptAt: new Date(Date.now() + 60_000),
    });

    await processQueue();

    expect((await EmailJob.findOne({ to: "due@example.com" })).status).toBe(
      "sent",
    );
    const later = await EmailJob.findOne({ to: "later@example.com" });
    expect(later.status).toBe("pending");
    expect(later.attempts).toBe(0);
  });
});

/* ─── Failure and retry ─────────────────────────────────── */

describe("processQueue — failure and retry", () => {
  it("reschedules a failed job with the correct delay and error", async () => {
    mockSendInviteEmail.mockRejectedValueOnce(new Error("Resend 500"));

    const job = await makeJob();
    await processQueue();

    const fresh = await EmailJob.findById(job._id);
    expect(fresh.status).toBe("pending");
    expect(fresh.attempts).toBe(1);
    expect(fresh.lastError).toBe("Resend 500");

    const delta = fresh.nextAttemptAt.getTime() - Date.now();
    expect(delta).toBeGreaterThanOrEqual(55_000);
    expect(delta).toBeLessThanOrEqual(65_000);
  });

  it("abandons after the final attempt fails", async () => {
    mockSendInviteEmail.mockRejectedValueOnce(new Error("Resend dead"));

    // attempts=5, claimOne bumps to 6 == MAX_ATTEMPTS → terminal.
    const job = await makeJob({ attempts: 5 });
    await processQueue();

    const fresh = await EmailJob.findById(job._id);
    expect(fresh.status).toBe("abandoned");
    expect(fresh.attempts).toBe(6);
    expect(fresh.completedAt).toBeInstanceOf(Date);
    expect(fresh.lastError).toBe("Resend dead");
  });

  it("never claims an abandoned job", async () => {
    await makeJob({ status: "abandoned", attempts: 6 });
    await processQueue();
    expect(mockSendInviteEmail).not.toHaveBeenCalled();
  });

  it("succeeds on the retry after a transient failure", async () => {
    mockSendInviteEmail
      .mockRejectedValueOnce(new Error("transient"))
      .mockResolvedValueOnce({ id: "resend_retry_ok" });

    const job = await makeJob();

    await processQueue(); // first attempt fails
    const afterFail = await EmailJob.findById(job._id);
    expect(afterFail.status).toBe("pending");
    expect(afterFail.attempts).toBe(1);

    // Force the retry to be due now.
    await EmailJob.updateOne(
      { _id: job._id },
      { $set: { nextAttemptAt: new Date(Date.now() - 1000) } },
    );

    await processQueue();

    const afterRetry = await EmailJob.findById(job._id);
    expect(afterRetry.status).toBe("sent");
    expect(afterRetry.attempts).toBe(2);
    expect(afterRetry.resendId).toBe("resend_retry_ok");
  });
});

/* ─── Lifecycle + stats ─────────────────────────────────── */

describe("worker lifecycle", () => {
  it("start is idempotent and stop is safe to call twice", () => {
    expect(() => startEmailQueueWorker()).not.toThrow();
    expect(() => startEmailQueueWorker()).not.toThrow();
    expect(() => stopEmailQueueWorker()).not.toThrow();
    expect(() => stopEmailQueueWorker()).not.toThrow();
  });
});

describe("getQueueStats", () => {
  it("returns counts by status", async () => {
    await makeJob({ status: "pending" });
    await makeJob({ status: "pending" });
    await makeJob({ status: "sent", attempts: 1, completedAt: new Date() });
    await makeJob({
      status: "abandoned",
      attempts: 6,
      completedAt: new Date(),
    });

    const stats = await getQueueStats();

    expect(stats).toEqual({
      pending: 2,
      sending: 0,
      sent: 1,
      failed: 0,
      abandoned: 1,
    });
  });
});