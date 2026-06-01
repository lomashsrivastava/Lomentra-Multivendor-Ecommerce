import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import User from '@/database/models/User'
import Store from '@/database/models/Store'
import Product from '@/database/models/Product'
import Category from '@/database/models/Category'
import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'

interface SeedCategoryNode {
  name: string
  isFeatured?: boolean
  subcategories?: SeedCategoryNode[]
}

const CATEGORY_SEED_TREE: SeedCategoryNode[] = [
  {
    name: "Fashion & Apparel",
    isFeatured: true,
    subcategories: [
      {
        name: "Men's Fashion",
        subcategories: [
          {
            name: "Top Wear",
            subcategories: [
              { name: "T-Shirts" },
              { name: "Polo T-Shirts" },
              { name: "Casual Shirts" },
              { name: "Formal Shirts" },
              { name: "Hoodies" },
              { name: "Sweatshirts" },
              { name: "Jackets" },
              { name: "Blazers" }
            ]
          },
          {
            name: "Bottom Wear",
            subcategories: [
              { name: "Jeans" },
              { name: "Trousers" },
              { name: "Shorts" },
              { name: "Track Pants" },
              { name: "Joggers" }
            ]
          },
          {
            name: "Ethnic Wear",
            subcategories: [
              { name: "Kurta" },
              { name: "Sherwani" },
              { name: "Dhoti" },
              { name: "Ethnic Sets" }
            ]
          },
          {
            name: "Innerwear",
            subcategories: [
              { name: "Vest" },
              { name: "Briefs" },
              { name: "Boxers" },
              { name: "Thermal Wear" }
            ]
          },
          {
            name: "Sleepwear",
            subcategories: [
              { name: "Night Suits" },
              { name: "Pajamas" }
            ]
          }
        ]
      },
      {
        name: "Women's Fashion",
        subcategories: [
          {
            name: "Western Wear",
            subcategories: [
              { name: "Dresses" },
              { name: "Tops" },
              { name: "T-Shirts" },
              { name: "Jumpsuits" },
              { name: "Skirts" }
            ]
          },
          {
            name: "Ethnic Wear",
            subcategories: [
              { name: "Sarees" },
              { name: "Kurtis" },
              { name: "Salwar Suits" },
              { name: "Lehenga" },
              { name: "Dupatta" }
            ]
          },
          {
            name: "Bottom Wear",
            subcategories: [
              { name: "Jeans" },
              { name: "Leggings" },
              { name: "Palazzo" },
              { name: "Shorts" }
            ]
          },
          {
            name: "Lingerie",
            subcategories: [
              { name: "Bras" },
              { name: "Panties" },
              { name: "Shapewear" }
            ]
          },
          {
            name: "Nightwear"
          }
        ]
      },
      {
        name: "Kids Fashion",
        subcategories: [
          { name: "Boys Clothing" },
          { name: "Girls Clothing" },
          { name: "Baby Clothing" },
          { name: "School Uniforms" }
        ]
      },
      {
        name: "Footwear",
        subcategories: [
          {
            name: "Men",
            subcategories: [
              { name: "Sneakers" },
              { name: "Loafers" },
              { name: "Formal Shoes" },
              { name: "Sandals" },
              { name: "Sports Shoes" }
            ]
          },
          {
            name: "Women",
            subcategories: [
              { name: "Heels" },
              { name: "Flats" },
              { name: "Sandals" },
              { name: "Boots" }
            ]
          },
          {
            name: "Kids",
            subcategories: [
              { name: "School Shoes" },
              { name: "Casual Shoes" }
            ]
          }
        ]
      },
      {
        name: "Bags & Luggage",
        subcategories: [
          { name: "Backpacks" },
          { name: "Handbags" },
          { name: "Travel Bags" },
          { name: "Wallets" },
          { name: "Suitcases" },
          { name: "Laptop Bags" }
        ]
      }
    ]
  },
  {
    name: "Electronics",
    isFeatured: true,
    subcategories: [
      {
        name: "Mobiles",
        subcategories: [
          {
            name: "Smartphones",
            subcategories: [
              { name: "Android Phones" },
              { name: "iPhones" },
              { name: "Foldable Phones" }
            ]
          },
          { name: "Feature Phones" },
          { name: "Refurbished Phones" }
        ]
      },
      {
        name: "Mobile Accessories",
        subcategories: [
          { name: "Cases & Covers" },
          { name: "Screen Protectors" },
          { name: "Chargers" },
          { name: "Power Banks" },
          { name: "Mobile Stands" },
          { name: "Cables" },
          { name: "Selfie Sticks" }
        ]
      },
      {
        name: "Computers",
        subcategories: [
          {
            name: "Laptops",
            subcategories: [
              { name: "Gaming Laptops" },
              { name: "Business Laptops" },
              { name: "Ultrabooks" }
            ]
          },
          { name: "Desktop PCs" },
          { name: "Monitors" },
          { name: "Storage Devices" },
          { name: "Keyboards" },
          { name: "Mouse" },
          { name: "Printers" },
          { name: "Routers" }
        ]
      },
      {
        name: "Audio",
        subcategories: [
          { name: "Earbuds" },
          { name: "Headphones" },
          { name: "Neckbands" },
          { name: "Speakers" },
          { name: "Soundbars" },
          { name: "Home Theater" }
        ]
      },
      {
        name: "Cameras",
        subcategories: [
          { name: "DSLR" },
          { name: "Mirrorless" },
          { name: "Action Camera" },
          { name: "CCTV" },
          { name: "Camera Lenses" }
        ]
      },
      {
        name: "Gaming",
        subcategories: [
          { name: "Consoles" },
          { name: "Controllers" },
          { name: "Gaming Chairs" },
          { name: "Gaming Mouse" },
          { name: "Gaming Keyboards" }
        ]
      }
    ]
  },
  {
    name: "Home & Furniture",
    isFeatured: true,
    subcategories: [
      {
        name: "Living Room",
        subcategories: [
          { name: "Sofas" },
          { name: "Coffee Tables" },
          { name: "TV Units" },
          { name: "Chairs" }
        ]
      },
      {
        name: "Bedroom",
        subcategories: [
          { name: "Beds" },
          { name: "Mattresses" },
          { name: "Wardrobes" },
          { name: "Dressing Tables" }
        ]
      },
      {
        name: "Dining",
        subcategories: [
          { name: "Dining Tables" },
          { name: "Dining Chairs" }
        ]
      },
      {
        name: "Kitchen Furniture",
        subcategories: [
          { name: "Kitchen Cabinets" },
          { name: "Kitchen Shelves" }
        ]
      },
      {
        name: "Home Decor",
        subcategories: [
          { name: "Wall Decor" },
          { name: "Paintings" },
          { name: "Clocks" },
          { name: "Artificial Plants" },
          { name: "Candles" }
        ]
      },
      {
        name: "Lamps & Lighting",
        subcategories: [
          { name: "LED Lights" },
          { name: "Ceiling Lights" },
          { name: "Wall Lights" },
          { name: "Table Lamps" }
        ]
      }
    ]
  },
  {
    name: "Kitchen & Appliances",
    isFeatured: true,
    subcategories: [
      {
        name: "Large Appliances",
        subcategories: [
          { name: "Refrigerator" },
          { name: "Washing Machine" },
          { name: "Air Conditioner" },
          { name: "Dishwasher" }
        ]
      },
      {
        name: "Small Appliances",
        subcategories: [
          { name: "Microwave" },
          { name: "Mixer Grinder" },
          { name: "Toaster" },
          { name: "Juicer" },
          { name: "Rice Cooker" },
          { name: "Coffee Maker" }
        ]
      },
      {
        name: "Cookware",
        subcategories: [
          { name: "Pressure Cooker" },
          { name: "Frying Pan" },
          { name: "Pots" },
          { name: "Kadai" }
        ]
      },
      {
        name: "Dinnerware",
        subcategories: [
          { name: "Plates" },
          { name: "Bowls" },
          { name: "Glasses" },
          { name: "Spoons" }
        ]
      }
    ]
  },
  {
    name: "Grocery",
    isFeatured: true,
    subcategories: [
      {
        name: "Fruits & Vegetables",
        subcategories: [
          { name: "Fresh Fruits" },
          { name: "Fresh Vegetables" },
          { name: "Organic Vegetables" }
        ]
      },
      {
        name: "Dairy",
        subcategories: [
          { name: "Milk" },
          { name: "Butter" },
          { name: "Cheese" },
          { name: "Yogurt" }
        ]
      },
      {
        name: "Snacks",
        subcategories: [
          { name: "Chips" },
          { name: "Cookies" },
          { name: "Namkeen" },
          { name: "Chocolates" }
        ]
      },
      {
        name: "Beverages",
        subcategories: [
          { name: "Tea" },
          { name: "Coffee" },
          { name: "Juice" },
          { name: "Soft Drinks" }
        ]
      },
      {
        name: "Staples",
        subcategories: [
          { name: "Rice" },
          { name: "Wheat" },
          { name: "Pulses" },
          { name: "Flour" }
        ]
      },
      {
        name: "Cooking Essentials",
        subcategories: [
          { name: "Oil" },
          { name: "Spices" },
          { name: "Salt" },
          { name: "Sugar" }
        ]
      }
    ]
  },
  {
    name: "Beauty & Personal Care",
    isFeatured: true,
    subcategories: [
      {
        name: "Makeup",
        subcategories: [
          { name: "Lipstick" },
          { name: "Foundation" },
          { name: "Eyeliner" },
          { name: "Mascara" }
        ]
      },
      {
        name: "Skin Care",
        subcategories: [
          { name: "Face Wash" },
          { name: "Moisturizers" },
          { name: "Sunscreen" },
          { name: "Serum" }
        ]
      },
      {
        name: "Hair Care",
        subcategories: [
          { name: "Shampoo" },
          { name: "Conditioner" },
          { name: "Hair Oil" },
          { name: "Hair Color" }
        ]
      },
      {
        name: "Men's Grooming",
        subcategories: [
          { name: "Beard Oil" },
          { name: "Shaving Kit" },
          { name: "Trimmer" }
        ]
      },
      {
        name: "Fragrances",
        subcategories: [
          { name: "Perfumes" },
          { name: "Deodorants" }
        ]
      }
    ]
  },
  {
    name: "Health & Wellness",
    isFeatured: true,
    subcategories: [
      {
        name: "Vitamins & Supplements",
        subcategories: [
          { name: "Vitamins" },
          { name: "Supplements" },
          { name: "Protein Powder" },
          { name: "Weight Management" }
        ]
      },
      {
        name: "Health Devices",
        subcategories: [
          { name: "BP Monitor" },
          { name: "Glucometer" },
          { name: "Thermometer" }
        ]
      }
    ]
  },
  {
    name: "Sports & Fitness",
    isFeatured: true,
    subcategories: [
      {
        name: "Fitness Equipment",
        subcategories: [
          { name: "Treadmill" },
          { name: "Dumbbells" },
          { name: "Exercise Bike" }
        ]
      },
      {
        name: "Outdoor Sports",
        subcategories: [
          {
            name: "Cricket",
            subcategories: [
              { name: "Bat" },
              { name: "Ball" },
              { name: "Gloves" }
            ]
          },
          { name: "Football" },
          { name: "Basketball" },
          { name: "Tennis" }
        ]
      },
      {
        name: "Yoga",
        subcategories: [
          { name: "Yoga Mat" },
          { name: "Yoga Accessories" }
        ]
      }
    ]
  },
  {
    name: "Books & Stationery",
    isFeatured: true,
    subcategories: [
      {
        name: "Books",
        subcategories: [
          { name: "Fiction" },
          { name: "Non-fiction" },
          { name: "Educational" },
          { name: "Competitive Exams" },
          { name: "Comics" }
        ]
      },
      {
        name: "Office Supplies",
        subcategories: [
          { name: "Pens" },
          { name: "Pencils" },
          { name: "Files" },
          { name: "Diaries" }
        ]
      },
      {
        name: "Art Supplies",
        subcategories: [
          { name: "Paint Brushes" },
          { name: "Sketch Books" }
        ]
      }
    ]
  },
  {
    name: "Toys & Baby Products",
    isFeatured: true,
    subcategories: [
      {
        name: "Toys",
        subcategories: [
          { name: "Action Figures" },
          { name: "Educational Toys" },
          { name: "Remote Control Toys" },
          { name: "Dolls" },
          { name: "Puzzles" }
        ]
      },
      {
        name: "Baby Care",
        subcategories: [
          { name: "Diapers" },
          { name: "Baby Food" },
          { name: "Feeding Bottles" },
          { name: "Strollers" },
          { name: "Baby Bedding" }
        ]
      }
    ]
  },
  {
    name: "Automotive",
    isFeatured: true,
    subcategories: [
      {
        name: "Car Accessories",
        subcategories: [
          { name: "Seat Covers" },
          { name: "Car Chargers" },
          { name: "Car Cleaning" }
        ]
      },
      {
        name: "Bike Accessories",
        subcategories: [
          { name: "Helmets" },
          { name: "Riding Gloves" }
        ]
      },
      {
        name: "Spare Parts",
        subcategories: [
          { name: "Tires" },
          { name: "Brake Parts" },
          { name: "Batteries" }
        ]
      }
    ]
  },
  {
    name: "Jewelry",
    isFeatured: true,
    subcategories: [
      { name: "Gold Jewelry" },
      { name: "Silver Jewelry" },
      { name: "Artificial Jewelry" },
      { name: "Rings" },
      { name: "Earrings" },
      { name: "Necklaces" },
      { name: "Bracelets" }
    ]
  },
  {
    name: "Pet Supplies",
    isFeatured: true,
    subcategories: [
      {
        name: "Dog",
        subcategories: [
          { name: "Dog Food" },
          { name: "Dog Toys" },
          { name: "Dog Beds" }
        ]
      },
      {
        name: "Cat",
        subcategories: [
          { name: "Cat Food" },
          { name: "Cat Toys" }
        ]
      },
      {
        name: "Fish",
        subcategories: [
          { name: "Aquarium" },
          { name: "Fish Food" }
        ]
      }
    ]
  },
  {
    name: "Digital Products",
    isFeatured: true,
    subcategories: [
      { name: "E-books" },
      { name: "Software" },
      { name: "Online Courses" },
      { name: "Website Templates" },
      { name: "Themes" }
    ]
  },
  {
    name: "Festival & Gifts",
    isFeatured: true,
    subcategories: [
      { name: "Birthday Gifts" },
      { name: "Anniversary Gifts" },
      { name: "Wedding Gifts" },
      { name: "Personalized Gifts" },
      { name: "Gift Cards" },
      { name: "Festival Hampers" }
    ]
  },
  {
    name: "Industrial & Business Supplies",
    isFeatured: true,
    subcategories: [
      { name: "Machinery" },
      { name: "Safety Equipment" },
      { name: "Industrial Tools" },
      { name: "Packaging Materials" }
    ]
  }
]

export async function GET(req: NextRequest) {
  // ── Security guard ───────────────────────────────────────────────────────────
  // In production the seed endpoint MUST be protected by a secret token passed
  // as ?secret=<SEED_SECRET> so random users cannot reset platform credentials.
  // In development/test the check is skipped so local seeding still works easily.
  const isProduction = process.env.NODE_ENV === 'production'
  if (isProduction) {
    const seedSecret = process.env.SEED_SECRET
    const providedSecret = req.nextUrl.searchParams.get('secret')
    if (!seedSecret || providedSecret !== seedSecret) {
      return NextResponse.json(
        { error: 'Forbidden: valid ?secret= token required to run the seeder in production' },
        { status: 403 }
      )
    }
  }
  // ─────────────────────────────────────────────────────────────────────────────

  try {
    await dbConnect()

    // Upsert default admin — always resets password so test credentials stay consistent
    const adminHashedPassword = await bcrypt.hash('admin@lomentra.com', 10)
    let adminUser = await User.findOneAndUpdate(
      { email: 'admin@lomentra.com' },
      {
        $set: {
          name: 'Lomentra Administrator',
          email: 'admin@lomentra.com',
          passwordHash: adminHashedPassword,
          role: 'admin',
          status: 'active',
          avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
        },
      },
      { upsert: true, new: true }
    )

    // 1. Upsert default vendor — always resets password so test credentials stay consistent
    const vendorHashedPassword = await bcrypt.hash('vendor@nexus.com', 10)
    let vendor = await User.findOneAndUpdate(
      { email: 'vendor@nexus.com' },
      {
        $set: {
          name: 'Nexus Prime Vendor',
          email: 'vendor@nexus.com',
          passwordHash: vendorHashedPassword,
          role: 'vendor',
          status: 'active',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        },
      },
      { upsert: true, new: true }
    )

    // 2. Create default store if not exists
    let store = await Store.findOne({ vendorId: vendor._id })
    if (!store) {
      store = await Store.create({
        vendorId: vendor._id,
        name: 'Nexus Future-Tech Emporium',
        slug: 'nexus-futuretech',
        description: 'Your premier destination for high-tech, futuristic apparel, smart home systems, and cybernetic accessories.',
        logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
        bannerUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
        status: 'active',
      })
    }

    const UNSPLASH_IMAGES: Record<string, string[]> = {
      'fashion-apparel': [
        'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1488161628813-04466f872be2?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80'
      ],
      'electronics': [
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1608248597481-496100c8c836?w=600&auto=format&fit=crop&q=80'
      ],
      'home-furniture': [
        'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=600&auto=format&fit=crop&q=80'
      ],
      'kitchen-appliances': [
        'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1578643463396-0997cb5328c1?w=600&auto=format&fit=crop&q=80'
      ],
      'grocery': [
        'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1506084868230-bb9d95c24759?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1534531173927-aeb928d54385?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1610832958506-ee56336191d1?w=600&auto=format&fit=crop&q=80'
      ],
      'beauty-personal-care': [
        'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1608248597481-496100c8c836?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1612817288484-6f916006741a?w=600&auto=format&fit=crop&q=80'
      ],
      'health-wellness': [
        'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&auto=format&fit=crop&q=80'
      ],
      'sports-fitness': [
        'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=600&auto=format&fit=crop&q=80'
      ],
      'books-stationery': [
        'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&auto=format&fit=crop&q=80'
      ],
      'toys-baby-products': [
        'https://images.unsplash.com/photo-1535378917042-10a22c95931a?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1515488042361-404e9250afef?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=600&auto=format&fit=crop&q=80'
      ],
      'automotive': [
        'https://images.unsplash.com/photo-1508974239320-0a029497e820?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=600&auto=format&fit=crop&q=80'
      ],
      'jewelry': [
        'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&auto=format&fit=crop&q=80'
      ],
      'pet-supplies': [
        'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=600&auto=format&fit=crop&q=80'
      ],
      'digital-products': [
        'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&auto=format&fit=crop&q=80'
      ],
      'festival-gifts': [
        'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1575550959106-5a7defe28b56?w=600&auto=format&fit=crop&q=80'
      ],
      'industrial-business-supplies': [
        'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1534224039826-c7a0dea0e66a?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1508873535684-277a3cbcc4e8?w=600&auto=format&fit=crop&q=80'
      ]
    }

    function getImagesForCategory(slug: string): string[] {
      for (const key of Object.keys(UNSPLASH_IMAGES)) {
        if (slug.startsWith(key)) {
          return UNSPLASH_IMAGES[key]
        }
      }
      return UNSPLASH_IMAGES['fashion-apparel']
    }

    function getOffsetForCategory(slug: string, mod: number): number {
      let hash = 0
      for (let i = 0; i < slug.length; i++) {
        hash = slug.charCodeAt(i) + ((hash << 5) - hash)
      }
      return Math.abs(hash) % mod
    }

    function generateProductName(catName: string, slug: string, index: number): string {
      const parentSlug = slug.split('-')[0]
      const FASHION_ADJ = ["Classic", "Premium Cotton", "Designer", "Urban Fit", "Vintage Retro", "Minimalist", "Cozy Soft", "Elite Tailored"]
      const ELEC_ADJ = ["NextGen Pro", "UltraTech X1", "Quantum Wireless", "Apex Smart", "Evo Core", "Horizon Lite", "Omni Digital", "Vector Pro"]
      const HOME_ADJ = ["Handcrafted", "Modern Minimalist", "Rustic Oak", "Nordic Design", "Luxury Velvet", "Cozy Nest", "Urban Loft", "Chic Decor"]
      const GROC_ADJ = ["Organic", "Farm-Fresh", "Pure Natural", "Premium Select", "Daily Essentials", "Gourmet Choice", "Sweet Harvest", "Stone-Ground"]
      const BEAUTY_ADJ = ["Radiant Glow", "Natural Herbal", "Ultra Hydrating", "Professional Care", "Silky Smooth", "Organic Essence", "Pure Radiance", "Youthful Glow"]
      const SPORTS_ADJ = ["High-Performance", "Pro-Athlete", "Endurance Series", "Flex-Fit", "Apex Training", "Weatherproof", "Comfort Grip", "Elite Edition"]
      
      let list = FASHION_ADJ
      if (parentSlug.startsWith('electronics')) list = ELEC_ADJ
      else if (parentSlug.startsWith('home') || parentSlug.startsWith('kitchen')) list = HOME_ADJ
      else if (parentSlug.startsWith('grocery')) list = GROC_ADJ
      else if (parentSlug.startsWith('beauty') || parentSlug.startsWith('health')) list = BEAUTY_ADJ
      else if (parentSlug.startsWith('sports')) list = SPORTS_ADJ
      
      const prefix = list[(index + catName.length) % list.length]
      const versions = ["", "v2", "Edition", "Series", "Pro", "Max"]
      const version = versions[(index * 2) % versions.length]
      
      let name = `${prefix} ${catName}`
      if (version) name += ` ${version}`
      return name
    }

    function generateProductDescription(catName: string, slug: string, name: string, index: number): string {
      const lowerName = catName.toLowerCase()
      const descTemplates = [
        `Experience the perfect blend of style and utility with this premium ${lowerName}. Designed for everyday wear and comfort, it features high-quality materials and exquisite craftsmanship.`,
        `Upgrade your collection with the all-new ${name}. Engineered for durability and high performance, this product delivers exceptional value and a sleek, modern aesthetic.`,
        `Discover ultimate comfort and premium quality. This ${lowerName} is meticulously crafted to fit seamlessly into your lifestyle, offering reliability you can trust day after day.`,
        `Designed for those who appreciate the finer things. Featuring a durable build and refined styling, this ${lowerName} brings both elegance and practical functionality to your setup.`,
        `Our best-selling ${lowerName} is back with enhanced features. Enjoy premium comfort, modern styling, and superior quality that stands out from the rest.`
      ]
      return descTemplates[index % descTemplates.length]
    }

    // 4. Seed categories first
    await Category.deleteMany({})

    const categoryMap = new Map<string, mongoose.Types.ObjectId>()
    const allCategories: any[] = []

    async function seedNodeTree(
      nodes: any[],
      parentId: mongoose.Types.ObjectId | null,
      parentSlug: string,
      level: number
    ) {
      for (const node of nodes) {
        const cleanName = node.name
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')

        const slug = parentSlug ? `${parentSlug}-${cleanName}` : cleanName

        const cat = await Category.create({
          name: node.name,
          slug,
          parentId,
          level,
          isActive: true,
          isFeatured: !!node.isFeatured,
        })

        allCategories.push(cat)

        if (node.subcategories && node.subcategories.length > 0) {
          await seedNodeTree(node.subcategories, cat._id as mongoose.Types.ObjectId, slug, level + 1)
        } else {
          categoryMap.set(slug, cat._id as mongoose.Types.ObjectId)
        }
      }
    }

    await seedNodeTree(CATEGORY_SEED_TREE, null, '', 1)

    // 5. Populate Products dynamically
    await Product.deleteMany({ storeId: store._id })

    // Find leaf categories
    const parentIds = new Set(allCategories.map(c => c.parentId?.toString()).filter(Boolean))
    const leafCategories = allCategories.filter(c => !parentIds.has(c._id.toString()))

    const generatedProducts = []

    for (const cat of leafCategories) {
      const imagesList = getImagesForCategory(cat.slug)
      const imageOffset = getOffsetForCategory(cat.slug, imagesList.length)
      
      // Seed exactly 5 products for each leaf category
      for (let i = 0; i < 5; i++) {
        const name = generateProductName(cat.name, cat.slug, i)
        const description = generateProductDescription(cat.name, cat.slug, name, i)
        
        const price = Math.round((15 + ((i * 33) % 950) + Math.random()) * 100) / 100
        const stock = 15 + ((i * 29) % 180)
        const imgUrl = imagesList[(imageOffset + i) % imagesList.length]

        generatedProducts.push({
          storeId: store._id,
          name,
          description,
          price,
          categoryId: cat._id,
          category: cat.name,
          stock,
          images: [imgUrl],
          status: 'active' as const
        })
      }
    }

    const insertedProducts = await Product.insertMany(generatedProducts)

    return NextResponse.json({
      success: true,
      message: `Successfully seeded database with categories and ${insertedProducts.length} products mapped to new category IDs!`,
      vendorEmail: 'vendor@nexus.com',
      vendorPassword: 'password123',
      storeSlug: store.slug,
    }, { status: 200 })
  } catch (error) {
    console.error('Seed database error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown seed error' },
      { status: 500 }
    )
  }
}
