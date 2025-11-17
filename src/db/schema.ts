import { pgTable, text, timestamp, boolean, integer, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull().$defaultFn(() => "user"),
  org: text("org").$defaultFn(() => "vyomchara"),
  emailVerified: boolean("email_verified")
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").$defaultFn(
    () => /* @__PURE__ */ new Date()
  ),
  updatedAt: timestamp("updated_at").$defaultFn(
    () => /* @__PURE__ */ new Date()
  ),
});

// Interview Tables
export const interviews = pgTable("interviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdBy: text("created_by").notNull(),
  // Removed foreign key reference for development flexibility
  // .references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
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
  studentId: text("student_id").references(() => user.id, { onDelete: "set null" }),
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
export const interviewsRelations = relations(interviews, ({ one, many }) => ({
  creator: one(user, {
    fields: [interviews.createdBy],
    references: [user.id],
  }),
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
  student: one(user, {
    fields: [interviewResponses.studentId],
    references: [user.id],
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
  user, 
  session, 
  account, 
  verification,
  interviews,
  interviewQuestions,
  interviewResponses,
  questionAnswers,
};