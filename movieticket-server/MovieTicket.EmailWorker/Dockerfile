# Базовий образ (ЗМІНЕНО runtime НА aspnet)
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
USER $APP_UID
WORKDIR /app

# Образ для збірки
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src

# КОПІЮЄМО ВСЕ ОДРАЗУ (щоб воркер бачив сусідні проєкти, наприклад MovieTicket.csproj)
COPY . .

# Переходимо в папку воркера, відновлюємо і компілюємо
WORKDIR "/src/MovieTicket.EmailWorker"
RUN dotnet restore "./MovieTicket.EmailWorker.csproj"
RUN dotnet build "./MovieTicket.EmailWorker.csproj" -c $BUILD_CONFIGURATION -o /app/build

# Публікація
FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "./MovieTicket.EmailWorker.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false /p:ErrorOnDuplicatePublishOutputFiles=false

# Фінал
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "MovieTicket.EmailWorker.dll"]