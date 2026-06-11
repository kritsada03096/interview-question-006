using Example.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace Example.Api.Data;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<ProductCode> ProductCodes => Set<ProductCode>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ProductCode>(entity =>
        {
            entity.HasKey(item => item.Id);
            entity.HasIndex(item => item.Code).IsUnique();
            entity.Property(item => item.Code).IsRequired().HasMaxLength(16);
            entity.Property(item => item.CreatedAt).IsRequired();
        });
    }
}
