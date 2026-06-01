namespace MovieTicket.Models;

public class Movie
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int DurationMinutes { get; set; }
    public string PosterUrl { get; set; } = string.Empty;
    public int ReleaseYear { get; set; }
    public List<string> Genres { get; set; } = new();
    public List<string> Actors { get; set; } = new();
}