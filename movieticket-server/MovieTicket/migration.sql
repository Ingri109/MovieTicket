Build started...
Build succeeded.
CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
    "MigrationId" character varying(150) NOT NULL,
    "ProductVersion" character varying(32) NOT NULL,
    CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY ("MigrationId")
);

START TRANSACTION;

CREATE TABLE "Halls" (
    "Id" uuid NOT NULL,
    "Name" text NOT NULL,
    "TotalSeats" integer NOT NULL,
    CONSTRAINT "PK_Halls" PRIMARY KEY ("Id")
);

CREATE TABLE "Movies" (
    "Id" uuid NOT NULL,
    "Title" text NOT NULL,
    "Description" text NOT NULL,
    "DurationMinutes" integer NOT NULL,
    "PosterUrl" text NOT NULL,
    "ReleaseYear" integer NOT NULL,
    "Genres" text[] NOT NULL,
    "Actors" text[] NOT NULL,
    CONSTRAINT "PK_Movies" PRIMARY KEY ("Id")
);

CREATE TABLE "Users" (
    "Id" uuid NOT NULL,
    "Email" text NOT NULL,
    "PasswordHash" text NOT NULL,
    "Role" integer NOT NULL,
    CONSTRAINT "PK_Users" PRIMARY KEY ("Id")
);

CREATE TABLE "Sessions" (
    "Id" uuid NOT NULL,
    "StartTime" timestamp with time zone NOT NULL,
    "MovieId" uuid NOT NULL,
    "HallId" uuid NOT NULL,
    CONSTRAINT "PK_Sessions" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_Sessions_Halls_HallId" FOREIGN KEY ("HallId") REFERENCES "Halls" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_Sessions_Movies_MovieId" FOREIGN KEY ("MovieId") REFERENCES "Movies" ("Id") ON DELETE CASCADE
);

CREATE TABLE "Tickets" (
    "Id" uuid NOT NULL,
    "SeatNumber" integer NOT NULL,
    "Price" numeric NOT NULL,
    "Status" integer NOT NULL,
    "LockedUntil" timestamp with time zone,
    "SessionId" uuid NOT NULL,
    "UserId" uuid,
    CONSTRAINT "PK_Tickets" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_Tickets_Sessions_SessionId" FOREIGN KEY ("SessionId") REFERENCES "Sessions" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_Tickets_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("Id")
);

CREATE INDEX "IX_Sessions_HallId" ON "Sessions" ("HallId");

CREATE INDEX "IX_Sessions_MovieId" ON "Sessions" ("MovieId");

CREATE INDEX "IX_Tickets_SessionId" ON "Tickets" ("SessionId");

CREATE INDEX "IX_Tickets_UserId" ON "Tickets" ("UserId");

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260506120508_InitialCreate', '8.0.11');

COMMIT;

START TRANSACTION;

ALTER TABLE "Users" ADD "IsEmailConfirmed" boolean NOT NULL DEFAULT FALSE;

ALTER TABLE "Users" ADD "Name" text NOT NULL DEFAULT '';

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260506125309_AddUserNameAndEmailConfirmation', '8.0.11');

COMMIT;

START TRANSACTION;

ALTER TABLE "Users" ADD "VerificationToken" text;

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260511134204_AddVerificationToken', '8.0.11');

COMMIT;

START TRANSACTION;

ALTER TABLE "Tickets" DROP COLUMN "LockedUntil";

ALTER TABLE "Tickets" DROP COLUMN "SeatNumber";

ALTER TABLE "Tickets" DROP COLUMN "Status";

ALTER TABLE "Tickets" ADD "PurchaseTime" timestamp with time zone NOT NULL DEFAULT TIMESTAMPTZ '-infinity';

ALTER TABLE "Tickets" ADD "SeatId" uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';

ALTER TABLE "Sessions" ADD "Price" numeric NOT NULL DEFAULT 0.0;

CREATE TABLE "Seats" (
    "Id" uuid NOT NULL,
    "HallId" uuid NOT NULL,
    "RowNumber" integer NOT NULL,
    "SeatNumber" integer NOT NULL,
    "Type" integer NOT NULL,
    "PriceMultiplier" numeric NOT NULL,
    CONSTRAINT "PK_Seats" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_Seats_Halls_HallId" FOREIGN KEY ("HallId") REFERENCES "Halls" ("Id") ON DELETE CASCADE
);

CREATE INDEX "IX_Tickets_SeatId" ON "Tickets" ("SeatId");

CREATE INDEX "IX_Seats_HallId" ON "Seats" ("HallId");

ALTER TABLE "Tickets" ADD CONSTRAINT "FK_Tickets_Seats_SeatId" FOREIGN KEY ("SeatId") REFERENCES "Seats" ("Id") ON DELETE CASCADE;

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260519132028_AddSeatForHalls', '8.0.11');

COMMIT;

START TRANSACTION;

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260520141722_AddingRabbitMQ', '8.0.11');

COMMIT;


