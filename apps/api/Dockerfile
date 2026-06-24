FROM eclipse-temurin:17-jdk
WORKDIR /app

RUN apt-get update && apt-get install -y maven && rm -rf /var/lib/apt/lists/*

COPY pom.xml ./
COPY src ./src
RUN mvn -q -DskipTests package

EXPOSE 8081
CMD ["java", "-jar", "target/api-0.0.1-SNAPSHOT.jar"]