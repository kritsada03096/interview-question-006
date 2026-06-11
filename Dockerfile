# Build Angular frontend
FROM node:22-alpine AS frontend-build
WORKDIR /src/frontend/example-web

COPY frontend/example-web/package*.json ./
RUN npm ci

COPY frontend/example-web/ ./
RUN npm run build

# Build .NET backend
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS backend-build
WORKDIR /src

COPY backend/Example.Api/Example.Api.csproj backend/Example.Api/
RUN dotnet restore backend/Example.Api/Example.Api.csproj

COPY backend/Example.Api/ backend/Example.Api/
RUN dotnet publish backend/Example.Api/Example.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

# Runtime image
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app

ENV ASPNETCORE_URLS=http://0.0.0.0:10000
ENV ASPNETCORE_ENVIRONMENT=Production
ENV ConnectionStrings__DefaultConnection="Data Source=/data/product-codes.db"

EXPOSE 10000

COPY --from=backend-build /app/publish ./
COPY --from=frontend-build /src/frontend/example-web/dist/example-web/browser ./wwwroot

RUN mkdir -p /data

ENTRYPOINT ["dotnet", "Example.Api.dll"]