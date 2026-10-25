import 'dotenv/config';
import pg from 'pg';
const { Pool } = pg;
if (!process.env.DATABASE_URL) {
  console.error('Missing DATABASE_URL. and configure your database.');
  process.exit(1);
}
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined });
const items = [
  ['Creamy Tuscan Pasta', 'Silky cream sauce, sun-dried tomatoes, spinach and parmesan.', 'Mains', 149, 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=1000&q=85', true],
  ['Classic Beef Burger', 'Juicy grilled beef, cheddar, crisp lettuce and house sauce.', 'Mains', 135, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1000&q=85', true],
  ['Garden Harvest Salad', 'Fresh greens, avocado, cherry tomatoes, cucumber and lemon dressing.', 'Starters', 89, 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1000&q=85', false],
  ['Margherita Pizza', 'Wood-fired style crust, tomato, mozzarella and fragrant basil.', 'Mains', 125, 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=1000&q=85', true],
  ['Golden Chicken Wings', 'Crispy wings tossed in a sticky sweet chilli glaze.', 'Starters', 95, 'https://images.unsplash.com/photo-1608039829572-78524f79c4c7?auto=format&fit=crop&w=1000&q=85', false],
  ['Chocolate Fudge Cake', 'Rich chocolate layers with a smooth ganache finish.', 'Desserts', 75, 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1000&q=85', true],
  ['Berry Cheesecake', 'Creamy vanilla cheesecake topped with a bright berry compote.', 'Desserts', 69, 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=1000&q=85', false],
  ['Iced Citrus Tea', 'Refreshing black tea, lemon and a hint of mint.', 'Drinks', 42, 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=1000&q=85', false],
  ['Creamy Mushroom Toast', 'Toasted sourdough topped with garlic mushrooms and herbs.', 'Starters', 82, 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=1000&q=85', false],
  ['Vanilla Berry Smoothie', 'A chilled blend of berries, yoghurt and vanilla.', 'Drinks', 55, 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?auto=format&fit=crop&w=1000&q=85', false]
];
try {
  await pool.query('TRUNCATE menu_items RESTART IDENTITY');
  for (const item of items) {
    await pool.query('INSERT INTO menu_items (name, description, category, price, image_url, featured) VALUES ($1,$2,$3,$4,$5,$6)', item);
  }
  console.log(`Seeded ${items.length} Lovely Restaurants menu items.`);
} catch (error) {
  console.error('Could not seed menu:', error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
