# --- Étape 1 : build -- compile le jar avec Maven, dans une image jetable qui ne
# finira pas dans l'image finale (pas de JDK ni d'outils de build en production).
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

# Copie uniquement le pom.xml d'abord : tant que les dépendances ne changent pas,
# Docker réutilise le cache de cette couche même si le code source change ensuite --
# évite de re-télécharger tout Maven Central à chaque build.
COPY pom.xml .
RUN mvn -B dependency:go-offline

COPY src ./src
RUN mvn -B clean package -DskipTests

# --- Étape 2 : exécution -- juste un JRE (pas le JDK complet) + le jar compilé.
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Utilisateur non-root : une bonne pratique de sécurité de base pour un conteneur
# exposé, même derrière le réseau interne de Coolify.
#
# /app doit appartenir a "spring" (et pas root, le proprietaire par defaut) : au
# premier upload d'image, le backend cree lui-meme le dossier uploads/ a l'interieur
# de /app (Files.createDirectories dans UploadController) -- sans cette ligne, cette
# creation echoue avec "Permission denied" (-> 500 cote client) des que le conteneur
# tourne sous l'utilisateur non-root "spring".
RUN addgroup -S spring && adduser -S spring -G spring \
    && mkdir -p /app/uploads \
    && chown -R spring:spring /app
USER spring

COPY --from=build --chown=spring:spring /app/target/*.jar app.jar

EXPOSE 8081

ENTRYPOINT ["java", "-jar", "app.jar"]
