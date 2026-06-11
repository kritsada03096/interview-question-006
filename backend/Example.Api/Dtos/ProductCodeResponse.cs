namespace Example.Api.Dtos;

public sealed record ProductCodeResponse(
    int Id,
    string FormattedCode,
    string Code,
    DateTimeOffset CreatedAt);
