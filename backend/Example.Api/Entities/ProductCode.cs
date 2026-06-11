namespace Example.Api.Entities;

public sealed class ProductCode
{
    public int Id { get; set; }
    public required string Code { get; set; }
    public DateTime CreatedAt { get; set; }
}
