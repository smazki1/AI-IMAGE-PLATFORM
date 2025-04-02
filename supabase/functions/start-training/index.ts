import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface RequestBody {
  user_name: string
  email: string
  category: 'business' | 'social' | 'creative'
  gender: 'woman' | 'man'
  order_id: string
}

serve(async (req: Request) => {
  try {
    const { user_name, email, category, gender, order_id }: RequestBody = await req.json()

    // Validate required fields
    if (!user_name || !email || !category || !gender || !order_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Fetch images from Supabase Storage
    const { data: files, error: listError } = await supabaseClient.storage
      .from('user-images')
      .list(`${order_id}-`)

    if (listError || !files?.length) {
      console.error('Failed to fetch images:', listError)
      return new Response(
        JSON.stringify({ error: 'No images found for order' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Download images
    const imageUrls = files.map(file => {
      const { data: publicUrl } = supabaseClient.storage
        .from('user-images')
        .getPublicUrl(`${order_id}-${file.name}`)
      return publicUrl.publicUrl
    })

    // Prepare form data for Astria API
    const formData = new FormData()
    formData.append('tune[title]', `${user_name}-${order_id}`)
    formData.append('tune[name]', `sks ${gender}`)
    formData.append('tune[preset]', 'flux-lora-portrait')
    formData.append('tune[callback]', 'https://wrveqjducybephioulsb.supabase.co/functions/v1/training-done')
    formData.append('tune[model_type]', 'lora')

    for (const url of imageUrls) {
      const response = await fetch(url)
      const blob = await response.blob()
      formData.append('tune[images][]', blob, 'image.jpg')
    }

    // Send POST request to Astria to create a tune
    const astriaResponse = await fetch('https://api.astria.ai/tunes', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('ASTRIA_API_KEY')}`
      },
      body: formData
    })

    if (!astriaResponse.ok) {
      const errorText = await astriaResponse.text()
      console.error('Astria API response:', astriaResponse.status, errorText)
      throw new Error(`Astria API error: ${astriaResponse.statusText} - ${errorText}`)
    }

    const astriaData = await astriaResponse.json()
    console.log('Astria response:', JSON.stringify(astriaData, null, 2))

    // Extract the correct tune_id
    const tune_id = astriaData.id.toString() // Ensure it's a string

    // Insert the order into the orders table
    const { error: insertError } = await supabaseClient
      .from('orders')
      .insert({
        id: order_id,
        user_name,
        email,
        category,
        gender,
        tune_id,
        status: 'training'
      })

    if (insertError) {
      console.error('Failed to insert order:', insertError)
      throw new Error(`Failed to insert order: ${insertError.message}`)
    }

    return new Response(
      JSON.stringify({ message: 'Training started successfully', tune_id }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in start-training:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})