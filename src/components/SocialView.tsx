"use client";

import { useState } from "react";

interface Account {
  name: string;
  handle: string;
  color: string;
  link: string;
  followers: string;
}

interface Post {
  id: string;
  title: string;
  platform: string;
  time: string;
  status: string;
  product?: string;
  content?: string;
  fullArticle?: string;
  hashtags?: string[];
  views?: string;
  likes?: string;
}

const accounts: Account[] = [
  { name: "eBay", handle: "@allfashionmatters", color: "bg-blue-600", link: "https://www.ebay.com/usr/allfashionmatters", followers: "2.4K" },
  { name: "TikTok", handle: "@fyifinds", color: "bg-black", link: "https://tiktok.com/@fyifinds", followers: "1.2K" },
  { name: "YouTube", handle: "FYIFinds", color: "bg-red-500", link: "https://www.youtube.com/channel/UCUcGM7G2tRh3eGBezCYMbfA", followers: "890" },
  { name: "Substack", handle: "@fyifinds", color: "bg-gray-600", link: "https://substack.com/@fyifinds", followers: "156" },
  { name: "Amazon Associates", handle: "fyifinds-20", color: "bg-orange-500", link: "https://www.amazon.com/shop/fyifinds", followers: "Active ✅" },
];

const tiktokPosts: Post[] = [
  { 
    id: "1", 
    title: "Running Shoes Review", 
    platform: "TikTok", 
    time: "Mon 7AM", 
    status: "scheduled", 
    product: "Nike Air Max", 
    content: "Check out these top running shoes for 2026! 🔥",
    fullArticle: `🎯 TOP 5 RUNNING SHOES FOR 2026!

Hey fitness fam! Here's my breakdown of the best running shoes you NEED to try this year:

1. NIKE AIR MAX - Classic comfort meets modern tech
2. HOKA CLIFTON - Maximum cushioning for long runs
3. BROOKS GHOST - Smooth ride, great durability
4. ADIDAS ULTRABOOST - Energy return like no other
5. NEW BALANCE FRESH FOAM - Cloud-like feel

Which one is your favorite? Drop it in the comments! 👇

#running #shoes #fitness #workout #nikon #hoka #adidas`,
    hashtags: ["#running", "#shoes", "#fitness", "#workout"], 
    views: "0", 
    likes: "0" 
  },
  { 
    id: "2", 
    title: "Workout Accessories", 
    platform: "TikTok", 
    time: "Wed 7AM", 
    status: "scheduled", 
    product: "Resistance Bands", 
    content: "Best workout accessories under $20",
    fullArticle: `💪 MUST-HAVE WORKOUT ACCESSORIES UNDER $20!

You don't need expensive gym equipment to get fit! Here are my favorite budget-friendly tools:

🔴 RESISTANCE BANDS - Perfect for home workouts
🟡 YOGA MAT - Non-slip, extra thick
🟢 DUMBBELL SET - Adjustable weights
🔵 FOAM ROLLER - Recovery essential
🟣 JUMP ROPE - Cardio killer

All under $20! Which one do you use? 

#workout #fitness #budget #gym #homeworkout #resistancebands`,
    hashtags: ["#workout", "#fitness", "#budget", "#gym"], 
    views: "0", 
    likes: "0" 
  },
  { 
    id: "3", 
    title: "Designer Fashion Finds", 
    platform: "TikTok", 
    time: "Fri 7AM", 
    status: "scheduled", 
    product: "Designer Sneakers", 
    content: "Designer sneakers at amazing prices",
    fullArticle: `👜 DESIGNER SNEAKERS AT AMAZING PRICES!

You don't have to break the bank for designer style! Here are my top picks:

👟 YEEZY 350 - Iconic silhouette
👟 JORDAN 1 - timeless classic
👟 BALENCIAGA TRACK - Streetwear luxury
👟 LOUIS VUITTON TRAINER - High fashion
👟 GUCCI ACE - Simple but sleek

Where to buy: Check my eBay for authenticated pairs! Link in bio.

#fashion #sneakers #designer #luxury #streetwear #jordan #yeezy`,
    hashtags: ["#fashion", "#sneakers", "#designer", "#luxury"], 
    views: "0", 
    likes: "0" 
  },
  { 
    id: "4", 
    title: "Fitness Journal Promo", 
    platform: "TikTok", 
    time: "As needed", 
    status: "draft", 
    product: "Amazon Journal", 
    content: "Track your fitness journey with this journal",
    fullArticle: `📓 TRACK YOUR FITNESS JOURNEY!

Ready to level up your fitness game? This journal has everything you need:

✅ Daily workout logging
✅ Meal planning sections  
✅ Progress photos tracker
✅ Goal setting worksheets
✅ Motivation quotes

Get it on Amazon - link in bio! 

#fitness #journal #goals #workout #health #fitnessjourney #motivation`,
    hashtags: ["#fitness", "#journal", "#goals", "#workout"], 
    views: "0", 
    likes: "0" 
  },
  { 
    id: "5", 
    title: "Nike Air Max Review", 
    platform: "TikTok", 
    time: "Last week", 
    status: "posted", 
    product: "Nike Air Max", 
    content: "My honest review of Nike Air Max",
    fullArticle: `👟 HONEST NIKE AIR MAX REVIEW!

Finally got my hands on the new Air Max! Here's my take:

PROS:
✅ Super comfortable
✅ Great cushioning
✅ Versatile style
✅ Breathable

CONS:
❌ Run big - size down
❌ Pricey ($180)
❌ Not for heavy runners

Overall: 8.5/10 - Would recommend!

What do you think? Agree? Drop your thoughts below! 👇

#nikon #airmax #review #sneakers #fashion #footwear`,
    hashtags: ["#nikon", "#airmax", "#review", "#sneakers"], 
    views: "1.2K", 
    likes: "89" 
  },
];

const youtubePosts: Post[] = [
  { 
    id: "1", 
    title: "5 Best Running Shoes 2026", 
    platform: "YouTube", 
    time: "Mon 7AM", 
    status: "scheduled", 
    content: "Top 5 running shoes you NEED to know about",
    fullArticle: `TITLE: 5 Best Running Shoes 2026 That You NEED To Try!

[INTRO - Upbeat music, quick cuts of running footage]

What's up everyone! Welcome back to FYIFinds! Today we're counting down the TOP 5 running shoes for 2026!

[Segment 1: Nike Air Max]
Number 5... Nike Air Max! Classic comfort meets modern tech. Perfect for everyday running and casual wear.

[Segment 2: Hoka Clifton]
Number 4... Hoka Clifton! Maximum cushioning that makes you feel like you're running on clouds. Great for long distances.

[Segment 3: Brooks Ghost]
Number 3... Brooks Ghost! Incredibly smooth ride with amazing durability. It's a fan favorite for a reason.

[Segment 2: Adidas Ultraboost]
Number 2... Adidas Ultraboost! The energy return is insane. These shoes actually push you forward with every step.

[Segment 1: New Balance Fresh Foam]
And our number 1 pick... New Balance Fresh Foam! Cloud-like feel with incredible support. Worth every penny!

[OUTRO]
So there you have it - my top 5 running shoes for 2026! Which one is your favorite? Let me know in the comments!

Don't forget to LIKE and SUBSCRIBE for more fitness content!

#running #shoes #fitness #hoka #nikon #adidas #newbalance`,
    hashtags: ["#running", "#shoes", "#fitness", "#hoka"], 
    views: "0", 
    likes: "0" 
  },
  { 
    id: "2", 
    title: "Workout Accessory Reviews", 
    platform: "YouTube", 
    time: "Wed 7AM", 
    status: "scheduled", 
    content: "Honest reviews of popular workout gear",
    fullArticle: `TITLE: Honest Reviews of Popular Workout Gear Under $50!

[INTRO]
Hey fitness fam! In this video, I'm reviewing the most popular workout accessories - all under $50!

[Review 1: Resistance Bands]
First up... resistance bands! These things are AMAZING for home workouts. Great resistance levels and super portable.

[Review 2: Foam Roller]
Foam roller - essential for recovery. Helps with muscle soreness and flexibility.

[Review 3: Jump Rope]
Jump rope - cardio killer! 10 minutes = huge calorie burn.

[Review 4: Workout Mat]
Premium yoga mat - worth the investment. Non-slip and extra thick for comfort.

[Review 5: Dumbbells]
Adjustable dumbbells - space-saving and perfect for home gyms.

[OUTRO]
Which review was most helpful? Drop a comment below! Like and subscribe!

#workout #fitness #reviews #gym #homeworkout #budget`,
    hashtags: ["#workout", "#fitness", "#reviews", "#gym"], 
    views: "0", 
    likes: "0" 
  },
  { 
    id: "3", 
    title: "Designer Fashion Weekly", 
    platform: "YouTube", 
    time: "Fri 7AM", 
    status: "scheduled", 
    content: "This week's best fashion finds",
    fullArticle: `TITLE: Designer Fashion Finds Under $100 - Weekly Roundup!

[INTRO]
Welcome back to our weekly designer fashion roundup! This week: finds under $100!

[Find 1: Designer Sneakers]
Starting with sneakers... found some amazing designer dupes that look JUST like the real thing!

[Find 2: Luxury Bags]
Designer bags at a fraction of the cost. Same quality, better price!

[Find 3: Watches]
Luxury watches that won't break the bank. Authenticated and ready to ship!

[Find 4: Jewelry]
Statement pieces that elevate any outfit.

[Find 5: Clothing]
Designer clothing finds - tops, jackets, everything!

[OUTRO]
All links in description! Save this video and follow for weekly finds!

#fashion #designer #luxury #style #sneakers #shopping`,
    hashtags: ["#fashion", "#designer", "#luxury", "#style"], 
    views: "0", 
    likes: "0" 
  },
];

const substackPosts: Post[] = [
  { 
    id: "1", 
    title: "The 5 Best Running Shoes of 2026", 
    platform: "Substack", 
    time: "Fri 9AM", 
    status: "posted", 
    product: "Running Shoes",
    content: "My comprehensive guide to the top running shoes this year",
    fullArticle: `The 5 Best Running Shoes of 2026

By FYIFinds | March 2026

After months of testing and researching, here's my definitive ranking of the best running shoes for 2026:

1. **Nike Air Max 2026**
The classic gets an upgrade. Improved cushioning technology makes this the most comfortable Air Max yet.
Rating: 9/10
Price: $180

2. **Hoka Clifton 9**
Still the king of cushioning. Perfect for long-distance runners who need maximum protection.
Rating: 8.5/10
Price: $145

3. **Brooks Ghost 15**
The reliable workhorse. Smooth ride and excellent durability make this a fan favorite.
Rating: 8.5/10
Price: $140

4. **Adidas Ultraboost 23**
Energy return that actually works. Great for daily training and casual wear.
Rating: 8/10
Price: $190

5. **New Balance Fresh Foam 1080v13**
The dark horse of the group. Incredible comfort at a competitive price.
Rating: 8/10
Price: $160

**Honorable Mentions:**
- Saucony Endorphin Speed 3
- ASICS Gel-Nimbus 25
- Puma Deviate Nitro 2

What's your pick? Let me know in the comments!

Subscribe for more weekly fitness content.`,
    hashtags: ["#running", "#shoes", "#fitness", "#reviews"], 
    views: "890", 
    likes: "67" 
  },
  { 
    id: "2", 
    title: "Workout Accessories That Actually Work", 
    platform: "Substack", 
    time: "Fri 9AM", 
    status: "scheduled", 
    product: "Accessories",
    content: "My top picks for budget-friendly workout gear",
    fullArticle: `Workout Accessories That Actually Work

By FYIFinds | Upcoming

Here's my curated list of workout accessories that won't break the bank:

**Resistance Bands**
Best for: Home workouts, travel, physical therapy
Price range: $10-30
My pick: Fit Simplify Resistance Bands

**Yoga Mats**
Best for: Yoga, stretching, floor exercises
Price range: $20-60
My pick: Gaiam Essentials Thick Yoga Mat

**Foam Rollers**
Best for: Muscle recovery, myofascial release
Price range: $15-50
My pick: TriggerPoint Grid Foam Roller

**Jump Ropes**
Best for: Cardio, HIIT workouts
Price range: $10-25
My pick: Crossrope Get Strong Jump Rope

**Adjustable Dumbbells**
Best for: Home gyms, space-saving
Price range: $80-300
My pick: Bowflex SelectTech 552

All these items have been tested by yours truly. Stay tuned for detailed reviews!

**Subscribe to get notified when this drops.**`,
    hashtags: ["#workout", "#fitness", "#budget", "#gear"], 
    views: "0", 
    likes: "0" 
  },
  { 
    id: "3", 
    title: "Designer Fashion at eBay Prices", 
    platform: "Substack", 
    time: "Fri 9AM", 
    status: "scheduled", 
    product: "Fashion",
    content: "How to find authentic designer deals on eBay",
    fullArticle: `Designer Fashion at eBay Prices

By FYIFinds | Upcoming

Who says you need to pay retail for designer fashion? Here's how to find authentic designer deals:

**Tips for Shopping Designer on eBay:**

1. **Look for Authentication Services**
eBay Authenticated program guarantees legitimacy.

2. **Check Seller Ratings**
Only buy from sellers with 98%+ positive feedback.

3. **Use Reverse Image Search**
Make sure photos are original, not stock images.

4. **Ask for Proof of Purchase**
Legitimate sellers can provide receipts.

**My Top Picks Currently Available:**

- Yeezy Boost 350 - $180 (retail $230)
- Jordan 1 High - $150 (retail $170)
- Louis Vuitton Neverfull - $280 (retail $1,200+)

**Red Flags to Avoid:**
- Prices too good to be true
- No original box/packaging
- Sellers with no history
- Generic stock photos

Happy hunting! 💰

**Follow for more weekly deals!**`,
    hashtags: ["#fashion", "#designer", "#ebay", "#shopping"], 
    views: "0", 
    likes: "0" 
  },
];

const platformColors: Record<string, string> = {
  TikTok: "bg-black",
  YouTube: "bg-red-500",
  Substack: "bg-gray-600",
  eBay: "bg-blue-600",
  Instagram: "bg-pink-500",
  Twitter: "bg-sky-500",
};

export default function SocialView() {
  const [activeTab, setActiveTab] = useState<"tiktok" | "youtube" | "substack" | "all">("all");
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const scheduled = [...tiktokPosts, ...youtubePosts, ...substackPosts].filter(p => p.status === "scheduled").length;
  const totalPosts = [...tiktokPosts, ...youtubePosts, ...substackPosts].length;
  const posted = [...tiktokPosts, ...youtubePosts, ...substackPosts].filter(p => p.status === "posted").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-[var(--text-primary)]">
          Social Media
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">
          FYIFinds & AllFashionMatters content strategy
        </p>
      </div>

      {/* Platform Tabs */}
      <div className="flex items-center gap-2">
        {[
          { id: "all", label: "All Platforms" },
          { id: "tiktok", label: "TikTok" },
          { id: "youtube", label: "YouTube" },
          { id: "substack", label: "Substack" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-[var(--accent-purple)] text-white"
                : "bg-white/5 text-[var(--text-secondary)] hover:bg-white/10"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Connected Accounts */}
      <div className="card p-4">
        <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
          Connected Accounts
        </h3>
        <div className="grid grid-cols-4 gap-3">
          {accounts.map((account) => (
            <a
              key={account.name}
              href={account.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              <div className={`w-10 h-10 rounded-lg ${account.color} flex items-center justify-center text-white text-sm font-bold`}>
                {account.name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-medium text-[var(--text-primary)]">
                  {account.name}
                </div>
                <div className="text-xs text-[var(--text-muted)]">
                  {account.handle}
                </div>
                <div className="text-xs text-purple-400">
                  {account.followers} followers
                </div>
              </div>
            </a>
          ))}
        </div>
        <p className="text-xs text-[var(--text-muted)] mt-2">
          * Follower counts N/A - Connect Postiz API for real-time data
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <div className="metric-card">
          <div className="metric-value text-[var(--text-primary)]">{totalPosts}</div>
          <div className="metric-label">Total Posts</div>
        </div>
        <div className="metric-card">
          <div className="metric-value text-blue-500">{scheduled}</div>
          <div className="metric-label">Scheduled</div>
        </div>
        <div className="metric-card">
          <div className="metric-value text-green-500">{posted}</div>
          <div className="metric-label">Posted</div>
        </div>
        <div className="metric-card">
          <div className="metric-value text-purple-500">{tiktokPosts.filter(p => p.status === "draft").length}</div>
          <div className="metric-label">Drafts</div>
        </div>
      </div>

      {/* TikTok Section */}
      {(activeTab === "all" || activeTab === "tiktok") && (
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-black" />
            <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              TikTok - @fyifinds
            </h3>
            <span className="px-2 py-0.5 rounded bg-green-500/20 text-green-400 text-xs">
              Warmed Up
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-3 rounded-lg bg-white/5">
              <div className="text-xs text-[var(--text-muted)] mb-1">Strategy</div>
              <div className="text-sm text-[var(--text-primary)]">6-slide slideshows with text overlays</div>
            </div>
            <div className="p-3 rounded-lg bg-white/5">
              <div className="text-xs text-[var(--text-muted)] mb-1">Schedule</div>
              <div className="text-sm text-[var(--text-primary)]">Mon/Wed/Fri at 7AM Chicago</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs text-[var(--text-muted)] uppercase mb-2">Content Queue - Click to view full article</div>
            {tiktokPosts.map((post) => (
              <button
                key={post.id}
                onClick={() => setSelectedPost(post)}
                className="w-full flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-black" />
                  <div>
                    <div className="text-sm font-medium text-[var(--text-primary)]">
                      {post.title}
                    </div>
                    <div className="text-xs text-[var(--text-muted)]">
                      {post.time} • {post.product}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {post.status === "posted" && (
                    <span className="text-xs text-[var(--text-muted)]">
                      {post.views} views • {post.likes} likes
                    </span>
                  )}
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    post.status === "scheduled" ? "bg-blue-500/20 text-blue-400" :
                    post.status === "draft" ? "bg-yellow-500/20 text-yellow-400" :
                    post.status === "posted" ? "bg-green-500/20 text-green-400" :
                    "bg-gray-500/20 text-gray-400"
                  }`}>
                    {post.status}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* YouTube Section */}
      {(activeTab === "all" || activeTab === "youtube") && (
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              YouTube Shorts - FYIFinds
            </h3>
            <span className="px-2 py-0.5 rounded bg-green-500/20 text-green-400 text-xs">
              Verified ✅
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-3 rounded-lg bg-white/5">
              <div className="text-xs text-[var(--text-muted)] mb-1">Strategy</div>
              <div className="text-sm text-[var(--text-primary)]">Short-form video (under 60s)</div>
            </div>
            <div className="p-3 rounded-lg bg-white/5">
              <div className="text-xs text-[var(--text-muted)] mb-1">Schedule</div>
              <div className="text-sm text-[var(--text-primary)]">Synced with TikTok (Mon/Wed/Fri)</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs text-[var(--text-muted)] uppercase mb-2">Content Queue - Click to view full script</div>
            {youtubePosts.map((post) => (
              <button
                key={post.id}
                onClick={() => setSelectedPost(post)}
                className="w-full flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div>
                    <div className="text-sm font-medium text-[var(--text-primary)]">
                      {post.title}
                    </div>
                    <div className="text-xs text-[var(--text-muted)]">
                      {post.time}
                    </div>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  post.status === "scheduled" ? "bg-blue-500/20 text-blue-400" :
                  post.status === "posted" ? "bg-green-500/20 text-green-400" :
                  "bg-gray-500/20 text-gray-400"
                }`}>
                  {post.status}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Substack Section */}
      {(activeTab === "all" || activeTab === "substack") && (
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-gray-600" />
            <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              Substack - @fyifinds
            </h3>
            <span className="px-2 py-0.5 rounded bg-green-500/20 text-green-400 text-xs">
              Active
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-3 rounded-lg bg-white/5">
              <div className="text-xs text-[var(--text-muted)] mb-1">Strategy</div>
              <div className="text-sm text-[var(--text-primary)]">Long-form articles + newsletter</div>
            </div>
            <div className="p-3 rounded-lg bg-white/5">
              <div className="text-xs text-[var(--text-muted)] mb-1">Schedule</div>
              <div className="text-sm text-[var(--text-primary)]">Fridays at 9AM Chicago</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs text-[var(--text-muted)] uppercase mb-2">Articles - Click to read full post</div>
            {substackPosts.map((post) => (
              <button
                key={post.id}
                onClick={() => setSelectedPost(post)}
                className="w-full flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-gray-600" />
                  <div>
                    <div className="text-sm font-medium text-[var(--text-primary)]">
                      {post.title}
                    </div>
                    <div className="text-xs text-[var(--text-muted)]">
                      {post.time} • {post.product}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {post.status === "posted" && (
                    <span className="text-xs text-[var(--text-muted)]">
                      {post.views} views • {post.likes} likes
                    </span>
                  )}
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    post.status === "scheduled" ? "bg-blue-500/20 text-blue-400" :
                    post.status === "draft" ? "bg-yellow-500/20 text-yellow-400" :
                    post.status === "posted" ? "bg-green-500/20 text-green-400" :
                    "bg-gray-500/20 text-gray-400"
                  }`}>
                    {post.status}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* eBay Section */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-3 h-3 rounded-full bg-blue-600" />
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
            eBay - @allfashionmatters
          </h3>
        </div>
        
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="p-3 rounded-lg bg-white/5">
            <div className="text-2xl font-bold text-[var(--text-primary)]">N/A</div>
            <div className="text-xs text-[var(--text-muted)]">Followers</div>
          </div>
          <div className="p-3 rounded-lg bg-white/5">
            <div className="text-2xl font-bold text-green-500">N/A</div>
            <div className="text-xs text-[var(--text-muted)]">Items Sold</div>
          </div>
          <div className="p-3 rounded-lg bg-white/5">
            <div className="text-2xl font-bold text-[var(--text-primary)]">4.9</div>
            <div className="text-xs text-[var(--text-muted)]">Rating</div>
          </div>
          <div className="p-3 rounded-lg bg-white/5">
            <div className="text-2xl font-bold text-purple-500">$$$</div>
            <div className="text-xs text-[var(--text-muted)]">Revenue</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs text-[var(--text-muted)] uppercase mb-2">Top Categories</div>
          <div className="flex flex-wrap gap-2">
            {["Nike Shoes", "Sorel Boots", "Gold Watches", "Designer Fashion", "Athletic Wear"].map((cat) => (
              <span key={cat} className="px-3 py-1 rounded-lg bg-white/5 text-sm text-[var(--text-secondary)]">
                {cat}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Content Calendar */}
      <div className="card p-4">
        <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">
          Weekly Content Calendar
        </h3>
        <div className="grid grid-cols-7 gap-2">
          {[
            { day: "Mon", content: ["TikTok: Running Shoes", "YouTube Shorts"], color: "border-l-4 border-purple-500" },
            { day: "Tue", content: ["Rest"], color: "border-l-4 border-gray-600" },
            { day: "Wed", content: ["TikTok: Accessories", "YouTube Shorts"], color: "border-l-4 border-purple-500" },
            { day: "Thu", content: ["Rest"], color: "border-l-4 border-gray-600" },
            { day: "Fri", content: ["TikTok: Fashion", "YouTube Shorts", "Newsletter"], color: "border-l-4 border-purple-500" },
            { day: "Sat", content: ["Rest"], color: "border-l-4 border-gray-600" },
            { day: "Sun", content: ["Plan Week"], color: "border-l-4 border-gray-600" },
          ].map((day) => (
            <div key={day.day} className={`p-3 rounded-lg bg-white/5 ${day.color}`}>
              <div className="text-sm font-bold text-[var(--text-primary)] mb-2">{day.day}</div>
              <div className="space-y-1">
                {day.content.map((c, i) => (
                  <div key={i} className="text-xs text-[var(--text-muted)]">{c}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Post Detail Modal */}
      {selectedPost && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedPost(null)}>
          <div className="bg-[var(--bg-card)] rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">{selectedPost.title}</h3>
              <button 
                onClick={() => setSelectedPost(null)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${platformColors[selectedPost.platform]}`} />
                <span className="text-sm text-[var(--text-secondary)]">{selectedPost.platform}</span>
                <span className={`ml-auto px-2 py-1 rounded text-xs ${
                  selectedPost.status === "scheduled" ? "bg-blue-500/20 text-blue-400" :
                  selectedPost.status === "draft" ? "bg-yellow-500/20 text-yellow-400" :
                  "bg-green-500/20 text-green-400"
                }`}>
                  {selectedPost.status}
                </span>
              </div>

              <div>
                <div className="text-xs text-[var(--text-muted)] mb-1">Scheduled Time</div>
                <div className="text-sm text-[var(--text-primary)]">{selectedPost.time}</div>
              </div>

              {selectedPost.product && (
                <div>
                  <div className="text-xs text-[var(--text-muted)] mb-1">Product</div>
                  <div className="text-sm text-[var(--text-primary)]">{selectedPost.product}</div>
                </div>
              )}

              <div>
                <div className="text-xs text-[var(--text-muted)] mb-1">Short Content</div>
                <div className="text-sm text-[var(--text-primary)] bg-white/5 p-3 rounded-lg">
                  {selectedPost.content}
                </div>
              </div>

              {selectedPost.fullArticle && (
                <div>
                  <div className="text-xs text-[var(--text-muted)] mb-2">📝 Full Article / Script</div>
                  <div className="text-sm text-[var(--text-primary)] bg-white/5 p-4 rounded-lg whitespace-pre-wrap max-h-64 overflow-y-auto">
                    {selectedPost.fullArticle}
                  </div>
                </div>
              )}

              {selectedPost.hashtags && (
                <div>
                  <div className="text-xs text-[var(--text-muted)] mb-1">Hashtags</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedPost.hashtags.map((tag) => (
                      <span key={tag} className="px-2 py-1 rounded bg-purple-500/20 text-purple-400 text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedPost.status === "posted" && (
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="bg-white/5 p-3 rounded-lg text-center">
                    <div className="text-lg font-bold text-[var(--text-primary)]">{selectedPost.views}</div>
                    <div className="text-xs text-[var(--text-muted)]">Views</div>
                  </div>
                  <div className="bg-white/5 p-3 rounded-lg text-center">
                    <div className="text-lg font-bold text-green-500">{selectedPost.likes}</div>
                    <div className="text-xs text-[var(--text-muted)]">Likes</div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-6">
              {selectedPost.status === "scheduled" && (
                <button className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">
                  Edit in Postiz
                </button>
              )}
              <button 
                onClick={() => setSelectedPost(null)}
                className="flex-1 py-2 rounded-lg bg-white/10 text-[var(--text-secondary)] text-sm font-medium hover:bg-white/20"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
