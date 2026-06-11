using Example.Api.Dtos;
using Example.Api.Services;

namespace Example.Api.Endpoints;

public static class ProductCodeEndpoints
{
    public static void MapProductCodeEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/product-codes");

        group.MapGet("", async (ProductCodeService service) =>
        {
            var items = await service.GetAllAsync();

            return Results.Ok(items);
        });

        group.MapPost("", async (ProductCodeCreateRequest request, ProductCodeService service) =>
        {
            var result = await service.CreateAsync(request.Code);

            if (result.Success && result.ProductCode is not null)
            {
                return Results.Created(
                    $"/api/product-codes/{result.ProductCode.Id}",
                    result.ProductCode);
            }

            return result.Error switch
            {
                CreateProductCodeError.InvalidFormat => Results.BadRequest(new { message = result.Message }),
                CreateProductCodeError.Duplicate => Results.Conflict(new { message = result.Message }),
                _ => Results.BadRequest(new { message = "ไม่สามารถเพิ่มข้อมูลได้" })
            };
        });

        group.MapDelete("/{id:int}", async (int id, ProductCodeService service) =>
        {
            var deleted = await service.DeleteAsync(id);

            return deleted ? Results.NoContent() : Results.NotFound();
        });
    }
}
