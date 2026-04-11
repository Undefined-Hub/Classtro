const formatDateTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString();
};

const formatMinutes = (value) => {
  if (value === null || value === undefined) return "";
  const minutes = Math.round(Number(value));
  return Number.isNaN(minutes) ? "" : `${minutes} min`;
};

const escapeHtml = (value) => {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
};

const buildAiSummary = (analyticsData) => {
  const sessionInfo = analyticsData?.sessionInfo || {};
  const questions = analyticsData?.questions || [];
  const polls = analyticsData?.polls || [];

  if (
    !sessionInfo.startAt ||
    !sessionInfo.endAt ||
    questions.length === 0 ||
    polls.length === 0
  ) {
    return null;
  }

  const durationMinutes = Math.round(
    (new Date(sessionInfo.endAt) - new Date(sessionInfo.startAt)) / (1000 * 60),
  );
  const answeredQuestions = questions.filter((q) => q.answered).length;
  const responseRate = questions.length
    ? Math.round((answeredQuestions / questions.length) * 100)
    : 0;
  const mostUpvotedQuestion = questions.reduce(
    (max, q) => (q.upvotes > (max?.upvotes || 0) ? q : max),
    questions[0],
  );
  const avgPollResponses = polls.length
    ? Math.round(
        polls.reduce((sum, p) => sum + (p.totalResponses || 0), 0) /
          polls.length,
      )
    : 0;

  return {
    overview: `This ${durationMinutes}-minute session on "${sessionInfo.title || "Session"}" engaged ${sessionInfo.totalParticipants || 0} participants with a peak attendance of ${sessionInfo.peakParticipants || 0}.`,
    engagement: `There were ${questions.length} questions, with ${answeredQuestions} answered (${responseRate}% response rate). The most upvoted question was "${(mostUpvotedQuestion?.text || "").slice(0, 80)}".`,
    interaction: `${polls.length} polls were conducted, averaging ${avgPollResponses} responses per poll.`,
  };
};

export const exportAnalyticsToPdf = (analyticsData) => {
  if (!analyticsData) return;

  const sessionInfo = analyticsData.sessionInfo || {};
  const included = analyticsData.includedSections || {
    participants: true,
    timeline: true,
    polls: true,
    qna: true,
    attendance: true,
    feedback: true,
    ai: true,
  };

  const participants = analyticsData.participants || [];
  const timeline = analyticsData.participantsTimeline || [];
  const polls = analyticsData.polls || [];
  const questions = analyticsData.questions || [];
  const feedback = analyticsData.feedback || {};
  const aiSummary = included.ai ? buildAiSummary(analyticsData) : null;

  const reportTitle = `${sessionInfo.title || "Session"} - Analytics Report`;

  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(reportTitle)}</title>
  <style>
    :root {
      color-scheme: light;
    }
    body {
      font-family: "Segoe UI", Tahoma, Arial, sans-serif;
      color: #111827;
      margin: 24px;
    }
    h1 {
      font-size: 22px;
      margin-bottom: 8px;
    }
    h2 {
      font-size: 16px;
      margin: 20px 0 8px;
    }
    p {
      margin: 0 0 6px;
      font-size: 12px;
      color: #374151;
    }
    .meta {
      margin-bottom: 16px;
      font-size: 12px;
      color: #4b5563;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
      margin: 12px 0 6px;
    }
    .card {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 10px;
      background: #f9fafb;
    }
    .card .label {
      font-size: 11px;
      color: #6b7280;
      margin-bottom: 4px;
    }
    .card .value {
      font-size: 16px;
      font-weight: 700;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
      margin-top: 8px;
    }
    th, td {
      border: 1px solid #e5e7eb;
      padding: 6px 8px;
      text-align: left;
      vertical-align: top;
    }
    th {
      background: #f3f4f6;
      font-weight: 600;
    }
    .section {
      margin-top: 18px;
      page-break-inside: avoid;
    }
    .small {
      font-size: 10px;
      color: #6b7280;
    }
    .badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 999px;
      background: #e5e7eb;
      font-size: 10px;
      color: #374151;
    }
  </style>
</head>
<body>
  <h1>${escapeHtml(reportTitle)}</h1>
  <div class="meta">
    <div>Room: ${escapeHtml(sessionInfo.roomName || "")}</div>
    <div>Start: ${escapeHtml(formatDateTime(sessionInfo.startAt))}</div>
    <div>End: ${escapeHtml(formatDateTime(sessionInfo.endAt))}</div>
  </div>

  <div class="grid">
    <div class="card">
      <div class="label">Total Participants</div>
      <div class="value">${escapeHtml(sessionInfo.totalParticipants || 0)}</div>
    </div>
    <div class="card">
      <div class="label">Peak Participants</div>
      <div class="value">${escapeHtml(sessionInfo.peakParticipants || 0)}</div>
    </div>
    <div class="card">
      <div class="label">Polls Conducted</div>
      <div class="value">${escapeHtml(sessionInfo.pollsConducted || 0)}</div>
    </div>
    <div class="card">
      <div class="label">Questions Asked</div>
      <div class="value">${escapeHtml(sessionInfo.questionsAsked || 0)}</div>
    </div>
  </div>

  ${
    included.timeline
      ? `
  <div class="section">
    <h2>Participant Timeline</h2>
    ${
      timeline.length
        ? `
      <table>
        <thead>
          <tr>
            <th>Time</th>
            <th>Active Participants</th>
          </tr>
        </thead>
        <tbody>
          ${timeline
            .map(
              (point) => `
              <tr>
                <td>${escapeHtml(point.time)}</td>
                <td>${escapeHtml(point.activeCount)}</td>
              </tr>
            `,
            )
            .join("")}
        </tbody>
      </table>
    `
        : `<p class="small">No timeline data available.</p>`
    }
  </div>
  `
      : ""
  }

  ${
    included.polls
      ? `
  <div class="section">
    <h2>Poll Analytics</h2>
    ${
      polls.length
        ? polls
            .map((poll) => {
              const options = poll.options || [];
              return `
          <div class="section">
            <p><strong>${escapeHtml(poll.question)}</strong></p>
            <p class="small">Total responses: ${escapeHtml(poll.totalResponses || 0)}</p>
            <table>
              <thead>
                <tr>
                  <th>Option</th>
                  <th>Votes</th>
                </tr>
              </thead>
              <tbody>
                ${options
                  .map(
                    (option) => `
                    <tr>
                      <td>${escapeHtml(option.text)}</td>
                      <td>${escapeHtml(option.votes || 0)}</td>
                    </tr>
                  `,
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
        `;
            })
            .join("")
        : `<p class="small">No poll data available.</p>`
    }
  </div>
  `
      : ""
  }

  ${
    included.qna
      ? `
  <div class="section">
    <h2>Q&A Insights</h2>
    ${
      questions.length
        ? `
      <table>
        <thead>
          <tr>
            <th>Question</th>
            <th>Author</th>
            <th>Upvotes</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${questions
            .map(
              (question) => `
              <tr>
                <td>${escapeHtml(question.text)}</td>
                <td>${escapeHtml(question.author || question.askedBy || "Anonymous")}</td>
                <td>${escapeHtml(question.upvotes || 0)}</td>
                <td>${question.answered ? "Answered" : "Open"}</td>
              </tr>
            `,
            )
            .join("")}
        </tbody>
      </table>
    `
        : `<p class="small">No questions available.</p>`
    }
  </div>
  `
      : ""
  }

  ${
    included.attendance
      ? `
  <div class="section">
    <h2>Attendance Report</h2>
    ${
      participants.length
        ? `
      <table>
        <thead>
          <tr>
            <th>Participant</th>
            <th>Join Time</th>
            <th>Leave Time</th>
            <th>Duration</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${participants
            .map(
              (participant) => `
              <tr>
                <td>${escapeHtml(participant.name)}</td>
                <td>${escapeHtml(formatDateTime(participant.joinAt))}</td>
                <td>${escapeHtml(formatDateTime(participant.leaveAt))}</td>
                <td>${escapeHtml(formatMinutes(participant.duration))}</td>
                <td>${escapeHtml(participant.attendanceStatus || participant.status || "")}</td>
              </tr>
            `,
            )
            .join("")}
        </tbody>
      </table>
    `
        : `<p class="small">No attendance data available.</p>`
    }
  </div>
  `
      : ""
  }

  ${
    included.feedback
      ? `
  <div class="section">
    <h2>Feedback Summary</h2>
    <p>Average rating: <span class="badge">${escapeHtml(feedback.averageRating || 0)}</span></p>
    <p>Sentiment: <span class="badge">${escapeHtml(feedback.sentiment || "neutral")}</span></p>
    ${
      feedback.comments && feedback.comments.length
        ? `
      <table>
        <thead>
          <tr>
            <th>Comments</th>
          </tr>
        </thead>
        <tbody>
          ${feedback.comments
            .map(
              (comment) => `
              <tr>
                <td>${escapeHtml(comment)}</td>
              </tr>
            `,
            )
            .join("")}
        </tbody>
      </table>
    `
        : `<p class="small">No feedback comments available.</p>`
    }
  </div>
  `
      : ""
  }

  ${
    included.ai && aiSummary
      ? `
  <div class="section">
    <h2>AI Insights</h2>
    <p>${escapeHtml(aiSummary.overview)}</p>
    <p>${escapeHtml(aiSummary.engagement)}</p>
    <p>${escapeHtml(aiSummary.interaction)}</p>
  </div>
  `
      : ""
  }
</body>
</html>`;

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.setAttribute("aria-hidden", "true");

  const cleanup = () => {
    if (iframe.parentNode) {
      iframe.parentNode.removeChild(iframe);
    }
  };

  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    cleanup();
    const printWindow = window.open("", "_blank", "noopener,noreferrer");
    if (!printWindow) return;
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    return;
  }

  doc.open();
  doc.write(html);
  doc.close();

  const onPrint = () => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
  };

  iframe.onload = () => {
    onPrint();
    if (iframe.contentWindow) {
      iframe.contentWindow.onafterprint = cleanup;
    }
  };

  // Fallback in case load event doesn't fire reliably.
  setTimeout(() => {
    onPrint();
  }, 300);
};
