using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using SmartInvest.Models.Entities;
using SmartInvest.Models.Entities.User;
using SmartInvest.Models.Entities.Investment;
using SmartInvest.Models.Entities.Partner;
using SmartInvest.Models.Entities.Subscription;

namespace SmartInvest.Data
{
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        // User
        public DbSet<UserProfile> UserProfiles { get; set; }
        
        // Investment
        public DbSet<Portfolio> Portfolios { get; set; }
        public DbSet<PortfolioAsset> PortfolioAssets { get; set; }
        public DbSet<Transaction> Transactions { get; set; }
        
        // Partners
        public DbSet<Partnership> Partnerships { get; set; }
        public DbSet<PartnerInvestmentProduct> PartnerInvestmentProducts { get; set; }
        public DbSet<PartnerTransaction> PartnerTransactions { get; set; }
        
        // Subscriptions
        public DbSet<SubscriptionPlan> SubscriptionPlans { get; set; }
        public DbSet<UserSubscription> UserSubscriptions { get; set; }
        public DbSet<Notification> Notifications { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // Configure relationships and constraints
            builder.Entity<Portfolio>()
                .HasMany(p => p.Assets)
                .WithOne(a => a.Portfolio)
                .HasForeignKey(a => a.PortfolioId);

            builder.Entity<Portfolio>()
                .HasMany(p => p.Transactions)
                .WithOne(t => t.Portfolio)
                .HasForeignKey(t => t.PortfolioId);

            builder.Entity<Partnership>()
                .HasMany(p => p.InvestmentProducts)
                .WithOne(ip => ip.Partnership)
                .HasForeignKey(ip => ip.PartnershipId);

            builder.Entity<SubscriptionPlan>()
                .HasMany(sp => sp.UserSubscriptions)
                .WithOne(us => us.SubscriptionPlan)
                .HasForeignKey(us => us.SubscriptionPlanId);

            // Decimal precision
            builder.Entity<Portfolio>()
                .Property(p => p.TotalValue)
                .HasPrecision(18, 2);

            builder.Entity<Transaction>()
                .Property(t => t.Amount)
                .HasPrecision(18, 2);
        }
    }
}
