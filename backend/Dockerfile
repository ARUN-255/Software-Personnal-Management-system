FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn -B clean package
FROM eclipse-temurin:17-jre
WORKDIR /app
RUN mkdir -p /app/uploads && chown -R 10001:10001 /app
COPY --from=build /app/target/personnel-management-1.0.0.jar app.jar
USER 10001
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
