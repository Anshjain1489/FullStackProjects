# ─────────────────────────────────────────────────────────────────────────────
#  Apex HMS — Spring Boot Multi-Stage Docker Build
#  Stage 1: Build the fat JAR with Maven
#  Stage 2: Minimal JRE runtime image
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM maven:3.9.6-eclipse-temurin-17-alpine AS build

WORKDIR /app

# Copy POM first — leverages Docker layer cache for dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -q

# Copy source and build
COPY src/ ./src/
RUN mvn clean package -DskipTests -q

# ── Stage 2: Runtime ──────────────────────────────────────────────────────────
FROM eclipse-temurin:17-jre-alpine

# Security: run as non-root user
RUN addgroup -S hms && adduser -S hms -G hms
WORKDIR /app

COPY --from=build /app/target/hospital-management-system-1.0.0.jar app.jar

RUN chown hms:hms app.jar
USER hms

# Render injects PORT env var; Spring Boot reads ${PORT:8080}
EXPOSE 8080

# Activate production profile on startup
ENTRYPOINT ["java", \
  "-Dspring.profiles.active=prod", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-jar", "app.jar"]
