CREATE TABLE "revoked_tokens" (
	"jti" varchar(64) PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone NOT NULL
);
