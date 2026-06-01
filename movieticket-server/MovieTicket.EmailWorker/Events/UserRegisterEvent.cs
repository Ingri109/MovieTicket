namespace MovieTicket.Events;

public record UserRegisteredEvent
{
    public string Email { get; init; } = string.Empty;
    public string VerificationToken { get; init; } = string.Empty;
}