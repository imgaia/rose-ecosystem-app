// e2e/fixture-data.ts
// Who is in the browser tests' throwaway database, shared by the fixture
// (e2e/fixture.ts) and the tests. These passwords exist only in that
// database, which e2e/run.ts deletes afterwards.

export const PASSWORD = "e2e-only-password";

export const USERS = {
  /** Owner and Treasurer of ROSE Org; RCC's home user. Signs in for most tests. */
  nora: { username: "nora", firstName: "Nora", lastName: "Test" },
  /** Joined through ROSE Org's invitation: a Member and an Owner, not a Treasurer. */
  annie: { username: "annie", firstName: "Annie", lastName: "Test" },
  /** Joined through Nora's invitation; no collection. */
  theo: { username: "theo", firstName: "Theo", lastName: "Test" },
} as const;

export type UserKey = keyof typeof USERS;

export const fullName = (user: UserKey) => `${USERS[user].firstName} ${USERS[user].lastName}`;

export const COLLECTION = "ROSE Org";
