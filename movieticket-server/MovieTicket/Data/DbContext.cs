using Microsoft.EntityFrameworkCore;
using MovieTicket.Models;

namespace MovieTicket.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<Movie> Movies { get; set; }
    public DbSet<Hall> Halls { get; set; }
    public DbSet<Session> Sessions { get; set; }
    public DbSet<Ticket> Tickets { get; set; }
    public DbSet<Seat> Seats { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        
        modelBuilder.Entity<User>().ToTable("Users");
        modelBuilder.Entity<Movie>().ToTable("Movies");
        modelBuilder.Entity<Hall>().ToTable("Halls");
        modelBuilder.Entity<Session>().ToTable("Sessions");
        modelBuilder.Entity<Ticket>().ToTable("Tickets");
        modelBuilder.Entity<Seat>().ToTable("Seats");
    }
}