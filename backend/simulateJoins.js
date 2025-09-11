const fs = require("fs");
const axios = require("axios");

async function run() {
  const config = JSON.parse(fs.readFileSync("students.json", "utf-8"));
  const { baseURL, sessions } = config;

  for (const session of sessions) {
    console.log(`\n➡️ Joining students to session ${session.code}...`);

    await Promise.all(
      session.students.map(async (student) => {
        try {
          const res = await axios.post(
            `${baseURL}/sessions/${session.code}/join`,
            student,
            { headers: { "Content-Type": "application/json" } }
          );
          console.log(`✅ ${student.name} joined ${session.code}`, res.data);
        } catch (err) {
          // Capture error details
          let reason = "Unknown error";

          if (err.response) {
            reason = `Status ${err.response.status} → ${
              err.response.data?.message || JSON.stringify(err.response.data)
            }`;
          } else if (err.request) {
            reason = "No response from server (network issue)";
          } else if (err.message) {
            reason = err.message;
          }

          console.error(
            `❌ Failed ${student.name} in ${session.code} → ${reason}`
          );
        }
      })
    );
  }
}

run();
