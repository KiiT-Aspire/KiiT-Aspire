const express = require("express");
const http = require("http");
const { WebSocketServer } = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// ── Health check ─────────────────────────────────────────────────────────────

app.get("/health", (_req, res) => {
  res.json({ status: "ok", rooms: rooms.size });
});

// ── Room state ───────────────────────────────────────────────────────────────
// rooms: Map<interviewId, { teachers: Set<ws>, students: Map<responseId, { ws, name }> }>

const rooms = new Map();

function getOrCreateRoom(interviewId) {
  if (!rooms.has(interviewId)) {
    rooms.set(interviewId, { teachers: new Set(), students: new Map() });
  }
  return rooms.get(interviewId);
}

function cleanupRoom(interviewId) {
  const room = rooms.get(interviewId);
  if (room && room.teachers.size === 0 && room.students.size === 0) {
    rooms.delete(interviewId);
  }
}

function broadcast(targets, message) {
  const payload = JSON.stringify(message);
  for (const ws of targets) {
    if (ws.readyState === 1) {
      ws.send(payload);
    }
  }
}

// ── WebSocket handling ───────────────────────────────────────────────────────

wss.on("connection", (ws) => {
  let clientRoom = null;
  let clientRole = null;
  let clientResponseId = null;
  let clientName = null;

  ws.on("message", (raw) => {
    try {
      // ws v8 delivers Buffers — must convert to string before parsing
      const msg = JSON.parse(typeof raw === "string" ? raw : raw.toString());

      // ── JOIN ────────────────────────────────────────────────────────────
      if (msg.type === "join") {
        const { role, interviewId, responseId, studentName } = msg;

        if (!interviewId || !role) return;

        clientRoom = interviewId;
        clientRole = role;
        clientResponseId = responseId || null;
        clientName = studentName || "Student";

        const room = getOrCreateRoom(interviewId);

        if (role === "teacher") {
          room.teachers.add(ws);
          // Send current student list to this teacher
          for (const [rid, info] of room.students) {
            ws.send(
              JSON.stringify({
                type: "student-joined",
                responseId: rid,
                studentName: info.name,
              })
            );
          }
          console.log(
            `[Room ${interviewId}] Teacher joined (${room.teachers.size} teachers, ${room.students.size} students)`
          );
        } else if (role === "student" && responseId) {
          room.students.set(responseId, { ws, name: studentName });
          // Notify all teachers
          broadcast(room.teachers, {
            type: "student-joined",
            responseId,
            studentName,
          });
          console.log(
            `[Room ${interviewId}] Student "${studentName}" joined (${room.students.size} students)`
          );
        }
        return;
      }

      // ── FRAME (student → teachers) ─────────────────────────────────────
      if (msg.type === "frame" && clientRole === "student" && clientRoom) {
        const room = rooms.get(clientRoom);
        if (!room || room.teachers.size === 0) return;

        const payload = JSON.stringify({
          type: "frame",
          responseId: clientResponseId,
          data: msg.data,
        });

        for (const t of room.teachers) {
          if (t.readyState === 1) {
            t.send(payload);
          }
        }
        return;
      }

      // ── TEACHER-AUDIO (teacher → specific student, private) ────────────
      if (msg.type === "teacher-audio" && clientRole === "teacher" && clientRoom) {
        const { targetResponseId, data } = msg;
        if (!targetResponseId || !data) return;

        const room = rooms.get(clientRoom);
        if (!room) return;

        const student = room.students.get(targetResponseId);
        if (!student || student.ws.readyState !== 1) return;

        student.ws.send(JSON.stringify({
          type: "teacher-audio",
          data,
        }));
        return;
      }
    } catch {
      // Ignore malformed messages
    }
  });

  ws.on("close", () => {
    if (!clientRoom) return;
    const room = rooms.get(clientRoom);
    if (!room) return;

    if (clientRole === "teacher") {
      room.teachers.delete(ws);
      console.log(
        `[Room ${clientRoom}] Teacher left (${room.teachers.size} remaining)`
      );
    } else if (clientRole === "student" && clientResponseId) {
      room.students.delete(clientResponseId);
      broadcast(room.teachers, {
        type: "student-left",
        responseId: clientResponseId,
      });
      console.log(
        `[Room ${clientRoom}] Student "${clientName}" left (${room.students.size} remaining)`
      );
    }

    cleanupRoom(clientRoom);
  });

  ws.on("error", () => {
    // Handled by close event
  });
});

// ── Start ────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`EchoGrade video server running on port ${PORT}`);
});
