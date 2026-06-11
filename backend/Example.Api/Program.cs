using Example.Api.Data;
using Example.Api.Endpoints;
using Example.Api.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy
            .WithOrigins(
                "http://localhost:4200",
                "https://localhost:4200",
                "http://127.0.0.1:4200",
                "https://127.0.0.1:4200")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")
        ?? "Data Source=product-codes.db"));

builder.Services.AddScoped<ProductCodeService>();

var app = builder.Build();

app.EnsureDatabaseCreated();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("Frontend");
app.UseDefaultFiles();
app.UseStaticFiles();

app.MapProductCodeEndpoints();
app.MapFallbackToFile("index.html");

app.Run();
