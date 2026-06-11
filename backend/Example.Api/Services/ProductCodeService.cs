using System.Text.RegularExpressions;
using Example.Api.Data;
using Example.Api.Dtos;
using Example.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace Example.Api.Services;

public sealed partial class ProductCodeService(AppDbContext db)
{
    public async Task<IReadOnlyList<ProductCodeResponse>> GetAllAsync()
    {
        var items = await db.ProductCodes
            .OrderByDescending(item => item.CreatedAt)
            .ToListAsync();

        return items.Select(ToResponse).ToList();
    }

    public async Task<CreateProductCodeResult> CreateAsync(string? requestCode)
    {
        var code = NormalizeCode(requestCode);

        if (!ProductCodeValidator().IsMatch(code))
        {
            return CreateProductCodeResult.Failed(
                CreateProductCodeError.InvalidFormat,
                "รหัสสินค้าต้องเป็นตัวเลขหรือตัวอักษร A-Z ความยาว 16 ตัว");
        }

        var exists = await db.ProductCodes.AnyAsync(item => item.Code == code);
        if (exists)
        {
            return CreateProductCodeResult.Failed(
                CreateProductCodeError.Duplicate,
                "รหัสสินค้านี้มีอยู่แล้ว");
        }

        var productCode = new ProductCode
        {
            Code = code,
            CreatedAt = DateTime.UtcNow
        };

        db.ProductCodes.Add(productCode);
        await db.SaveChangesAsync();

        return CreateProductCodeResult.Created(ToResponse(productCode));
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var productCode = await db.ProductCodes.FindAsync(id);
        if (productCode is null)
        {
            return false;
        }

        db.ProductCodes.Remove(productCode);
        await db.SaveChangesAsync();

        return true;
    }

    private static string NormalizeCode(string? code)
    {
        return (code ?? string.Empty)
            .Trim()
            .Replace("-", string.Empty, StringComparison.Ordinal)
            .ToUpperInvariant();
    }

    private static string FormatCode(string code)
    {
        return string.Join("-", Enumerable.Range(0, 4).Select(index => code.Substring(index * 4, 4)));
    }

    private static ProductCodeResponse ToResponse(ProductCode productCode)
    {
        return new ProductCodeResponse(
            productCode.Id,
            FormatCode(productCode.Code),
            productCode.Code,
            new DateTimeOffset(DateTime.SpecifyKind(productCode.CreatedAt, DateTimeKind.Utc)));
    }

    [GeneratedRegex("^[A-Z0-9]{16}$")]
    private static partial Regex ProductCodeValidator();
}
