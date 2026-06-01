using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using MovieTicket.Data;
using MovieTicket.DTOs.Halls;
using MovieTicket.Interfaces;
using MovieTicket.Models;

namespace MovieTicket.Services;

public class HallService : IHallService
{
    private readonly AppDbContext _context;
    private readonly IMapper _mapper;
    private readonly IMemoryCache _cache;
    
    private const string AllHallsCacheKey = "all_halls";

    public HallService(AppDbContext context, IMapper mapper, IMemoryCache cache)
    {
        _context = context;
        _mapper = mapper;
        _cache = cache;
    }
    
    public async Task<IEnumerable<HallDto>> GetAllHallsAsync()
    {
        if (!_cache.TryGetValue(AllHallsCacheKey, out IEnumerable<HallDto>? hallsDto))
        {
            var halls = await _context.Halls.AsNoTracking().ToListAsync();
            hallsDto = _mapper.Map<IEnumerable<HallDto>>(halls);
            
            _cache.Set(AllHallsCacheKey, hallsDto, TimeSpan.FromHours(24));
        }
        return hallsDto;
    }

    public async Task<HallDto?> GetHallByIdAsync(Guid id)
    {
        var allHalls = await GetAllHallsAsync();
        return allHalls.FirstOrDefault(h => h.Id == id);
    }

    public async Task<HallDto> CreateHallAsync(HallCreateDto hallDto)
{
    // 1. Створюємо сам зал
    var hall = new Hall
    {
        Id = Guid.NewGuid(),
        Name = hallDto.Name,
        TotalSeats = hallDto.Capacity // Твоя властивість місткості
    };

    await _context.Halls.AddAsync(hall);

    // ==========================================
    // МАТЕМАТИЧНИЙ КАСКАД РОЗПОДІЛУ МІСЦЬ
    // ==========================================
    
    // Ліміти за замовчуванням (10% та 30%)
    int maxVipAllowed = (int)Math.Floor(hallDto.Capacity * 0.10);
    int basePremiumAllowed = (int)Math.Floor(hallDto.Capacity * 0.30);

    // Розрахунок VIP
    int finalVipCount = Math.Min(hallDto.RequestedVipSeats, maxVipAllowed);
    int vipUnusedRollover = maxVipAllowed - finalVipCount; // Залишок переходить до Premium

    // Розрахунок Premium (базовий ліміт + залишок від VIP)
    int maxPremiumAllowed = basePremiumAllowed + vipUnusedRollover;
    int finalPremiumCount = Math.Min(hallDto.RequestedPremiumSeats, maxPremiumAllowed);
    
    // Базові місця забирають усе, що залишилося
    int finalBasicCount = hallDto.Capacity - finalVipCount - finalPremiumCount;

    // ==========================================
    // ГЕНЕРАЦІЯ СХЕМИ ЗАЛУ (Ряди та Місця)
    // ==========================================
    
    // Припустимо, що в одному ряду стандартно 10 крісел
    const int SeatsPerRow = 10;
    int currentRow = 1;
    int currentSeatInRow = 1;

    // Функція-помічник для створення місць у сітці залу
    void AddSeatsToGrid(int count, SeatType type, decimal multiplier)
    {
        for (int i = 0; i < count; i++)
        {
            var seat = new Seat
            {
                Id = Guid.NewGuid(),
                HallId = hall.Id,
                RowNumber = currentRow,
                SeatNumber = currentSeatInRow,
                Type = type,
                PriceMultiplier = multiplier
            };
            
            _context.Seats.Add(seat);

            // Перехід на наступне крісло / ряд
            currentSeatInRow++;
            if (currentSeatInRow > SeatsPerRow)
            {
                currentSeatInRow = 1;
                currentRow++;
            }
        }
    }

    // Спочатку створюємо VIP (зазвичай найкращі місця, нехай будуть першими або останніми)
    AddSeatsToGrid(finalVipCount, SeatType.Vip, 1.6m);
    
    // Потім Premium
    AddSeatsToGrid(finalPremiumCount, SeatType.Premium, 1.3m);
    
    // Наприкінці — Базові
    AddSeatsToGrid(finalBasicCount, SeatType.Basic, 1.0m);

    // Зберігаємо зал разом із згенерованими місцями
    await _context.SaveChangesAsync();

    // Очищаємо кеш залів, бо з'явився новий
    _cache.Remove("all_halls");

    return _mapper.Map<HallDto>(hall);
}

    public async Task<bool> UpdateHallAsync(Guid id, HallCreateDto hallDto)
    {
        var hall = await _context.Halls.FindAsync(id);
        if (hall == null) return false;

        _mapper.Map(hallDto, hall);
        await _context.SaveChangesAsync();

        // ІНВАЛІДАЦІЯ КЕШУ
        _cache.Remove(AllHallsCacheKey);

        return true;
    }

    public async Task<bool> DeleteHallAsync(Guid id)
    {
        var hall = await _context.Halls.FindAsync(id);
        if (hall == null) return false;

        _context.Halls.Remove(hall);
        await _context.SaveChangesAsync();

        // ІНВАЛІДАЦІЯ КЕШУ
        _cache.Remove(AllHallsCacheKey);

        return true;
    }
}