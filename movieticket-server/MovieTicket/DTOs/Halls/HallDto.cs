namespace MovieTicket.DTOs.Halls;

public class HallDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Capacity { get; set; }
}