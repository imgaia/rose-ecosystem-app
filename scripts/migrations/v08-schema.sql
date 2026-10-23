-- CreateTable
CREATE TABLE "Node" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "name" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "description" TEXT,
    "photoUrl" TEXT,
    "username" TEXT,
    "passwordHash" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Role" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "native" BOOLEAN NOT NULL
);

-- CreateTable
CREATE TABLE "Capability" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "RoleCapability" (
    "roleKey" TEXT NOT NULL,
    "capabilityKey" TEXT NOT NULL,

    PRIMARY KEY ("roleKey", "capabilityKey"),
    CONSTRAINT "RoleCapability_roleKey_fkey" FOREIGN KEY ("roleKey") REFERENCES "Role" ("key") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RoleCapability_capabilityKey_fkey" FOREIGN KEY ("capabilityKey") REFERENCES "Capability" ("key") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RoleAssignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scopeNodeId" TEXT NOT NULL,
    "holderNodeId" TEXT NOT NULL,
    "roleKey" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" DATETIME,
    CONSTRAINT "RoleAssignment_scopeNodeId_fkey" FOREIGN KEY ("scopeNodeId") REFERENCES "Node" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RoleAssignment_holderNodeId_fkey" FOREIGN KEY ("holderNodeId") REFERENCES "Node" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RoleAssignment_roleKey_fkey" FOREIGN KEY ("roleKey") REFERENCES "Role" ("key") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NodeRuleValue" (
    "nodeId" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    PRIMARY KEY ("nodeId", "ruleId"),
    CONSTRAINT "NodeRuleValue_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "Node" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Relationship" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nodeAId" TEXT NOT NULL,
    "nodeBId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "formedAt" DATETIME,
    CONSTRAINT "Relationship_nodeAId_fkey" FOREIGN KEY ("nodeAId") REFERENCES "Node" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Relationship_nodeBId_fkey" FOREIGN KEY ("nodeBId") REFERENCES "Node" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TrustScore" (
    "relationshipId" TEXT NOT NULL PRIMARY KEY,
    "value" REAL NOT NULL DEFAULT 0.75,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TrustScore_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "Relationship" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Interaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "relationshipId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "payerNodeId" TEXT NOT NULL,
    "payeeNodeId" TEXT NOT NULL,
    "proposerNodeId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PROPOSED',
    "nextDueAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Interaction_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "Relationship" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InteractionTerms" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "interactionId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "description" TEXT,
    "amount" INTEGER NOT NULL,
    "currencyId" TEXT NOT NULL,
    "frequency" TEXT NOT NULL DEFAULT 'ONCE',
    "paymentMode" TEXT NOT NULL DEFAULT 'AUTOMATIC',
    "startDate" DATETIME,
    "endDate" DATETIME,
    "maxPayments" INTEGER,
    "rulesVersion" TEXT NOT NULL,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InteractionTerms_interactionId_fkey" FOREIGN KEY ("interactionId") REFERENCES "Interaction" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InteractionTerms_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "Currency" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InteractionCurator" (
    "interactionId" TEXT NOT NULL,
    "curatorNodeId" TEXT NOT NULL,

    PRIMARY KEY ("interactionId", "curatorNodeId"),
    CONSTRAINT "InteractionCurator_interactionId_fkey" FOREIGN KEY ("interactionId") REFERENCES "Interaction" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Verification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "interactionId" TEXT NOT NULL,
    "curatorNodeId" TEXT NOT NULL,
    "confirmed" BOOLEAN NOT NULL,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Verification_interactionId_fkey" FOREIGN KEY ("interactionId") REFERENCES "Interaction" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Proposal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "proposerNodeId" TEXT NOT NULL,
    "proposedByPersonId" TEXT NOT NULL,
    "interactionId" TEXT,
    "subjectNodeId" TEXT,
    "payload" TEXT NOT NULL,
    "comment" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" DATETIME,
    CONSTRAINT "Proposal_interactionId_fkey" FOREIGN KEY ("interactionId") REFERENCES "Interaction" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProposalApprover" (
    "proposalId" TEXT NOT NULL,
    "approverNodeId" TEXT NOT NULL,
    "decision" BOOLEAN,
    "decidedByPersonId" TEXT,
    "decidedAt" DATETIME,
    "comment" TEXT,

    PRIMARY KEY ("proposalId", "approverNodeId"),
    CONSTRAINT "ProposalApprover_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Currency" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "kind" TEXT NOT NULL,
    "decimals" INTEGER NOT NULL DEFAULT 2,
    "issuerNodeId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Currency_issuerNodeId_fkey" FOREIGN KEY ("issuerNodeId") REFERENCES "Node" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nodeId" TEXT NOT NULL,
    "currencyId" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "isPrimaryFiat" BOOLEAN NOT NULL DEFAULT false,
    "isReserve" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Account_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "Node" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Account_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "Currency" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kind" TEXT NOT NULL,
    "fromAccountId" TEXT,
    "toAccountId" TEXT,
    "amount" INTEGER NOT NULL,
    "toAmount" INTEGER,
    "rate" TEXT,
    "comment" TEXT NOT NULL,
    "interactionId" TEXT,
    "groupId" TEXT,
    "actedByPersonId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Transaction_fromAccountId_fkey" FOREIGN KEY ("fromAccountId") REFERENCES "Account" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Transaction_toAccountId_fkey" FOREIGN KEY ("toAccountId") REFERENCES "Account" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Transaction_interactionId_fkey" FOREIGN KEY ("interactionId") REFERENCES "Interaction" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Invitation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "inviterNodeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "tokenHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "expiresAt" DATETIME NOT NULL,
    "acceptedNodeId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Invitation_inviterNodeId_fkey" FOREIGN KEY ("inviterNodeId") REFERENCES "Node" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nodeId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "refId" TEXT,
    "summary" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Activity_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "Node" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Node_username_key" ON "Node"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Node_email_key" ON "Node"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Node_phone_key" ON "Node"("phone");

-- CreateIndex
CREATE INDEX "RoleAssignment_holderNodeId_idx" ON "RoleAssignment"("holderNodeId");

-- CreateIndex
CREATE INDEX "RoleAssignment_scopeNodeId_roleKey_idx" ON "RoleAssignment"("scopeNodeId", "roleKey");

-- CreateIndex
CREATE UNIQUE INDEX "Relationship_nodeAId_nodeBId_key" ON "Relationship"("nodeAId", "nodeBId");

-- CreateIndex
CREATE INDEX "Interaction_payerNodeId_idx" ON "Interaction"("payerNodeId");

-- CreateIndex
CREATE INDEX "Interaction_payeeNodeId_idx" ON "Interaction"("payeeNodeId");

-- CreateIndex
CREATE UNIQUE INDEX "InteractionTerms_interactionId_version_key" ON "InteractionTerms"("interactionId", "version");

-- CreateIndex
CREATE INDEX "ProposalApprover_approverNodeId_decision_idx" ON "ProposalApprover"("approverNodeId", "decision");

-- CreateIndex
CREATE UNIQUE INDEX "Account_nodeId_currencyId_isReserve_key" ON "Account"("nodeId", "currencyId", "isReserve");

-- CreateIndex
CREATE INDEX "Transaction_fromAccountId_idx" ON "Transaction"("fromAccountId");

-- CreateIndex
CREATE INDEX "Transaction_toAccountId_idx" ON "Transaction"("toAccountId");

-- CreateIndex
CREATE INDEX "Transaction_interactionId_idx" ON "Transaction"("interactionId");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_tokenHash_key" ON "Invitation"("tokenHash");

-- CreateIndex
CREATE INDEX "Activity_nodeId_createdAt_idx" ON "Activity"("nodeId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

