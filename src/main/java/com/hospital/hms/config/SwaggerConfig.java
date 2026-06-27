package com.hospital.hms.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeIn;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.info.License;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import org.springframework.context.annotation.Configuration;

/**
 * SpringDoc / Swagger UI configuration.
 * Server URLs are intentionally omitted here — SpringDoc auto-detects
 * the correct server URL from the incoming request in both local and
 * production (Railway) environments.
 */
@Configuration
@OpenAPIDefinition(
        info = @Info(
                title = "🏥 Apex Hospital Management System API",
                version = "1.0.0",
                description = """
                        A comprehensive REST API for managing hospital operations.

                        **Modules:** Authentication · Patients · Doctors · Departments ·
                        Appointments · Rooms · Medical Records · Billing & Invoicing

                        **Authentication:** Use `POST /api/auth/login` to obtain a JWT token,
                        then click **Authorize** and enter `Bearer <token>`.
                        """,
                contact = @Contact(name = "Apex HMS Support", email = "support@apexhospital.com"),
                license = @License(name = "MIT License")
        ),
        security = @SecurityRequirement(name = "bearerAuth")
)
@SecurityScheme(
        name        = "bearerAuth",
        description = "JWT Bearer Token — paste your token after 'Bearer '",
        scheme      = "bearer",
        type        = SecuritySchemeType.HTTP,
        bearerFormat = "JWT",
        in          = SecuritySchemeIn.HEADER
)
public class SwaggerConfig {
}
