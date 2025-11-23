// Script to fix seller IDs for your listings
// Run this with: node fix-my-seller-id.js

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://olkpmvzfwvtivasxceqd.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_ROLE_KEY_HERE'
);

async function fixMyListings() {
  console.log('🔍 Checking for listings with wrong seller IDs...\n');
  
  // Show current state
  const { data: allListings } = await supabase
    .from('Listing')
    .select('id, title, sellerId')
    .order('id', { ascending: true });
    
  console.log('Current listings:');
  console.table(allListings);
  
  // Show all profiles
  const { data: profiles } = await supabase
    .from('Profile')
    .select('id, supabaseId, name')
    .order('id', { ascending: true });
    
  console.log('\nAll profiles:');
  console.table(profiles);
  
  // Fix: Update listings with sellerId 1401 to sellerId 1
  console.log('\n🔧 Updating listings from sellerId 1401 to sellerId 1...\n');
  
  const { data: updated, error } = await supabase
    .from('Listing')
    .update({ sellerId: 1 })
    .eq('sellerId', 1401)
    .select();
    
  if (error) {
    console.error('❌ Error:', error);
    return;
  }
  
  console.log(`✅ Updated ${updated?.length || 0} listings:`);
  console.table(updated);
  
  // Verify
  console.log('\n✅ Final state:');
  const { data: finalListings } = await supabase
    .from('Listing')
    .select('id, title, sellerId')
    .order('id', { ascending: true });
  console.table(finalListings);
}

fixMyListings().catch(console.error);
