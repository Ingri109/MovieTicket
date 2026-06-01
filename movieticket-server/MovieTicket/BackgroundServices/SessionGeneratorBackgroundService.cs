using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection;
using MovieTicket.Data;
using MovieTicket.DTOs.Sessions;
using MovieTicket.Interfaces;
using Microsoft.Extensions.Logging;

namespace MovieTicket.BackgroundServices;

public class SessionGeneratorBackgroundService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<SessionGeneratorBackgroundService> _logger;

    public SessionGeneratorBackgroundService(
        IServiceProvider serviceProvider, 
        ILogger<SessionGeneratorBackgroundService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Фоновий генератор сеансів запущено.");

        // Працюємо в циклі, поки додаток не буде зупинено
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await GenerateSessionsAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Помилка під час генерації сеансів.");
            }

            // Чекаємо 24 години до наступного запуску
            // Для тестування можеш змінити на TimeSpan.FromMinutes(1)
            await Task.Delay(TimeSpan.FromDays(7), stoppingToken);
        }
    }

    private async Task GenerateSessionsAsync(CancellationToken stoppingToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var sessionService = scope.ServiceProvider.GetRequiredService<ISessionService>();

        // 1. Прибрали .Take(5), тепер беремо ВСІ доступні фільми
        var halls = await context.Halls.ToListAsync(stoppingToken);
        var movies = await context.Movies.ToListAsync(stoppingToken); 

        if (!halls.Any() || !movies.Any())
        {
            _logger.LogWarning("Немає залів або фільмів для генерації сеансів.");
            return;
        }

        var startDate = DateTime.UtcNow.Date.AddDays(1);
        var endDate = startDate.AddDays(7);

        var timeSlots = new[] 
        { 
            new TimeSpan(10, 0, 0),
            new TimeSpan(13, 0, 0),
            new TimeSpan(16, 30, 0),
            new TimeSpan(19, 0, 0),
            new TimeSpan(21, 30, 0)
        };

        int addedSessionsCount = 0;
        
        // 2. Глобальний лічильник фільмів (не обнуляється між залами чи днями)
        int globalMovieIndex = 0;

        for (var date = startDate; date <= endDate; date = date.AddDays(1))
        {
            // 3. ЗМІНЕНО ПОРЯДОК ЦИКЛІВ: спочатку час, потім зал
            foreach (var timeSlot in timeSlots)
            {
                foreach (var hall in halls)
                {
                    // Беремо фільм по колу для поточного слоту і залу
                    var movie = movies[globalMovieIndex % movies.Count]; 
                    
                    // Відразу перемикаємо на наступний фільм для наступного залу, 
                    // щоб в один і той самий час не було однакових фільмів
                    globalMovieIndex++; 

                    var sessionStartTime = DateTime.SpecifyKind(date.Add(timeSlot), DateTimeKind.Utc);

                    var createDto = new SessionCreateDto
                    {
                        MovieId = movie.Id,
                        HallId = hall.Id,
                        StartTime = sessionStartTime,
                        Price = 150m
                    };

                    // Намагаємося створити сеанс
                    var createdSession = await sessionService.CreateSessionAsync(createDto);

                    if (createdSession != null)
                    {
                        addedSessionsCount++;
                    }
                }
            }
        }

        _logger.LogInformation($"Автоматична генерація завершена. Додано нових сеансів: {addedSessionsCount}");
    }
}