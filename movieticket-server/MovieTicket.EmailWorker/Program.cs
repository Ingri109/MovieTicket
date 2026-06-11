using MassTransit;
using Microsoft.EntityFrameworkCore;
using MovieTicket.Data;
using MovieTicket.EmailWorker;
using MovieTicket.EmailWorker.Jobs;
using Quartz;

var builder = Host.CreateApplicationBuilder(args);

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddMassTransit(x =>
{
    // 1. Реєструємо нашого слухача
    x.AddConsumer<TicketBookedConsumer>();
    x.AddConsumer<UserRegisteredConsumer>();

    x.UsingRabbitMq((context, cfg) =>
    {
        // Тепер він чесно братиме URL з .env файлу через конфіг!
        var rabbitUrl = builder.Configuration["RabbitMq:Url"]; 
    
        if (!string.IsNullOrEmpty(rabbitUrl))
        {
            cfg.Host(new Uri(rabbitUrl));
        }

        cfg.ConfigureEndpoints(context);
    });
});

builder.Services.AddQuartz(q =>
{
    // Налаштовуємо Quartz для роботи через DI-контейнер
    q.UseMicrosoftDependencyInjectionJobFactory();

    // РЕЄСТРУЄМО КРОН-ЗАДАЧУ (Пункт 4)
    var jobKey = new JobKey("DatabaseCleanupJob");
    q.AddJob<DatabaseCleanupJob>(opts => opts.WithIdentity(jobKey));
    
    q.AddTrigger(opts => opts
        .ForJob(jobKey)
        .WithIdentity("DatabaseCleanupJob-Trigger")
        .WithCronSchedule("0 0 2 * * ?"));
});

// Додаємо Quartz як фонову службу, що стартує разом з додатком
builder.Services.AddQuartzHostedService(q => q.WaitForJobsToComplete = true);

var host = builder.Build();
host.Run();