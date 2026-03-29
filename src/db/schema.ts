import { pgTable, text, timestamp, boolean, integer, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Interview Tables
export const interviews = pgTable("interviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdBy: text("created_by").notNull(),
  // Removed foreign key reference for development flexibility
  // .references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  timeLimit: integer("time_limit").notNull().default(30), // in minutes
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

export const interviewQuestions = pgTable("interview_questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  interviewId: uuid("interview_id")
    .notNull()
    .references(() => interviews.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  subject: text("subject").notNull(),
  order: integer("order").notNull(),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

export const interviewResponses = pgTable("interview_responses", {
  id: uuid("id").primaryKey().defaultRandom(),
  interviewId: uuid("interview_id")
    .notNull()
    .references(() => interviews.id, { onDelete: "cascade" }),
  studentId: text("student_id"),
  studentName: text("student_name"),
  studentEmail: text("student_email"),
  startedAt: timestamp("started_at")
    .$defaultFn(() => new Date())
    .notNull(),
  completedAt: timestamp("completed_at"),
  score: integer("score"),
  evaluation: text("evaluation"),
  status: text("status").notNull().default("in_progress"), // 'in_progress', 'completed', 'abandoned'
});

export const questionAnswers = pgTable("question_answers", {
  id: uuid("id").primaryKey().defaultRandom(),
  responseId: uuid("response_id")
    .notNull()
    .references(() => interviewResponses.id, { onDelete: "cascade" }),
  questionText: text("question_text").notNull(),
  audioUrl: text("audio_url"),
  audioTranscript: text("audio_transcript"),
  audioDuration: integer("audio_duration"), // in seconds
  answeredAt: timestamp("answered_at")
    .$defaultFn(() => new Date())
    .notNull(),
  questionOrder: integer("question_order").notNull(),
});

// Relations
export const interviewsRelations = relations(interviews, ({ many }) => ({
  questions: many(interviewQuestions),
  responses: many(interviewResponses),
}));

export const interviewQuestionsRelations = relations(interviewQuestions, ({ one }) => ({
  interview: one(interviews, {
    fields: [interviewQuestions.interviewId],
    references: [interviews.id],
  }),
}));

export const interviewResponsesRelations = relations(interviewResponses, ({ one, many }) => ({
  interview: one(interviews, {
    fields: [interviewResponses.interviewId],
    references: [interviews.id],
  }),
  answers: many(questionAnswers),
}));

export const questionAnswersRelations = relations(questionAnswers, ({ one }) => ({
  response: one(interviewResponses, {
    fields: [questionAnswers.responseId],
    references: [interviewResponses.id],
  }),
}));

export const schema = { 
  interviews,
  interviewQuestions,
  interviewResponses,
  questionAnswers,
};