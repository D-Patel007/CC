// Quick script to fix seller IDs in database
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://olkpmvzfwvtivasxceqd.supabase.co',
  'sb_secret_UOkx3v-dw1n4uOCoQrRV7A_07fxMOyQ'
);

async function fixSellerIds() {
  console.log('🔍 Checking listings with invalid seller IDs...');
  
  const { data: badListings } = await supabase
    .from('Listing')
    .select('id, title, sellerId, authorId')
    .not('sellerId', 'in', '(1401,1402)');
    
  console.log('Found listings with invalid seller IDs:', badListings);
  
  console.log('\n🔧 Updating listings with sellerId = 1 to 1401...');
  const { data: updatedListings, error: listingError } = await supabase
    .from('Listing')
    .update({ sellerId: 1401 })
    .eq('sellerId', 1)
    .select();
    
  console.log('Updated listings:', updatedListings);
  if (listingError) console.error('Listing update error:', listingError);
  
  console.log('\n🔧 Updating transactions with sellerId = 1 to 1401...');
  const { data: updatedTransactions, error: txError } = await supabase
    .from('Transaction')
    .update({ sellerId: 1401 })
    .eq('sellerId', 1)
    .select();
    
  console.log('Updated transactions:', updatedTransactions);
  if (txError) console.error('Transaction update error:', txError);
  
  console.log('\n✅ Verification:');
  const { data: listing27 } = await supabase
    .from('Listing')
    .select('id, title, sellerId')
    .eq('id', 27)
    .single();
  console.log('Listing 27:', listing27);
  
  const { data: recentTxs } = await supabase
    .from('Transaction')
    .select('id, sellerId, buyerId')
    .eq('sellerId', 1401)
    .order('id', { ascending: false })
    .limit(5);
  console.log('Recent transactions with sellerId 1401:', recentTxs);
}

fixSellerIds().catch(console.error);
