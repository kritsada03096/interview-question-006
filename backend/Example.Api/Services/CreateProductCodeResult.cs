using Example.Api.Dtos;

namespace Example.Api.Services;

public enum CreateProductCodeError
{
    None,
    InvalidFormat,
    Duplicate
}

public sealed record CreateProductCodeResult(
    bool Success,
    ProductCodeResponse? ProductCode,
    CreateProductCodeError Error,
    string? Message)
{
    public static CreateProductCodeResult Created(ProductCodeResponse productCode)
    {
        return new CreateProductCodeResult(true, productCode, CreateProductCodeError.None, null);
    }

    public static CreateProductCodeResult Failed(CreateProductCodeError error, string message)
    {
        return new CreateProductCodeResult(false, null, error, message);
    }
}
