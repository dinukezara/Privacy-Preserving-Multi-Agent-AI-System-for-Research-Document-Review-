const { spawn } = require("child_process");
const path = require("path");

const agentProjectPath = path.resolve(__dirname, "../../privacy-agentic-peer-review");

function runAgentReview(input) {
  return new Promise((resolve, reject) => {
    const python = spawn(process.env.PYTHON_EXECUTABLE || "python", ["-m", "src.agents.web_review"], {
      cwd: agentProjectPath,
      env: { ...process.env, PYTHONUNBUFFERED: "1" },
    });

    let stdout = "";
    let stderr = "";

    python.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    python.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    python.on("error", reject);
    python.on("close", (code) => {
      if (code !== 0) {
        return reject(new Error(stderr.trim() || "The agent review process failed"));
      }

      try {
        const result = JSON.parse(stdout);
        if (result.error) return reject(new Error(result.error));
        resolve(result);
      } catch {
        reject(new Error("The agent returned an invalid response"));
      }
    });

    python.stdin.end(JSON.stringify(input));
  });
}

module.exports = { runAgentReview };