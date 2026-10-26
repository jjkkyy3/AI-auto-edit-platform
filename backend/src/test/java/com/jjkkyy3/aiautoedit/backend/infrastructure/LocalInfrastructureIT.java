package com.jjkkyy3.aiautoedit.backend.infrastructure;

import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.Properties;

import org.junit.jupiter.api.Test;
import redis.clients.jedis.Jedis;
import redis.clients.jedis.exceptions.JedisException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.fail;

/** Explicit local-infra-it profile only. Never targets the existing database on 5432. */
class LocalInfrastructureIT {

    @Test
    void postgresRespondsToSelectOne() {
        String password = requiredEnvironment("POSTGRES_PASSWORD");
        assertEquals("ai_auto_edit_local", requiredEnvironment("POSTGRES_DB"),
                "Only the dedicated local project database is permitted");
        assertEquals("ai_auto_edit_local", requiredEnvironment("POSTGRES_USER"),
                "Only the dedicated local project role is permitted");

        Properties properties = new Properties();
        properties.setProperty("user", "ai_auto_edit_local");
        properties.setProperty("password", password);
        properties.setProperty("connectTimeout", "3");
        properties.setProperty("socketTimeout", "3");
        properties.setProperty("loginTimeout", "5");

        try (var connection = DriverManager.getConnection(
                "jdbc:postgresql://127.0.0.1:15432/ai_auto_edit_local", properties);
                var statement = connection.createStatement()) {
            statement.setQueryTimeout(3);
            try (var result = statement.executeQuery("SELECT 1")) {
                assertTrue(result.next(), "SELECT 1 must return a row");
                assertEquals(1, result.getInt(1));
            }
        } catch (SQLException exception) {
            fail("Local project PostgreSQL connection check failed; SQLState="
                    + exception.getSQLState() + ". Credentials and driver details omitted.");
        }
    }

    @Test
    void redisRespondsToPing() {
        String password = requiredEnvironment("REDIS_PASSWORD");
        // This constructor applies the finite timeout to both connecting and reading.
        try (Jedis jedis = new Jedis("127.0.0.1", 6379, 3000)) {
            jedis.auth(password);
            assertEquals("PONG", jedis.ping());
        } catch (JedisException exception) {
            fail("Local project Redis connection check failed. Credentials and client details omitted.");
        }
    }

    private static String requiredEnvironment(String name) {
        String value = System.getenv(name);
        if (value == null || value.isBlank()) {
            return fail("Missing required environment variable: " + name
                    + ". Integration validation must fail rather than skip.");
        }
        return value;
    }
}
