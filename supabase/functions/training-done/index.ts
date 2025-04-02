import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req: Request) => {
  try {
    const body = await req.json()

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Check if this is the first callback (training completed)
    if (body.tune_id && body.trained_at) {
      const { tune_id, trained_at } = body
      console.log('Received training completed callback:', { tune_id, trained_at })

      // Fetch the order from the orders table
      const { data: order, error: fetchError } = await supabaseClient
        .from('orders')
        .select('*')
        .eq('tune_id', tune_id)
        .single()

      if (fetchError || !order) {
        console.error('Order not found:', fetchError)
        return new Response(
          JSON.stringify({ error: 'Order not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        )
      }

      // Define 3 different prompts
      const prompts = [
        'A professional headshot of a woman in a suit, standing in a modern office, sharp lighting, confident expression, sks woman',
        'A casual portrait of a woman in a park, wearing a summer dress, soft sunlight, smiling, sks woman',
        'A futuristic portrait of a woman in a cyberpunk city, neon lights, wearing a leather jacket, intense expression, sks woman'
      ]

      // Update the order with the prompts
      const { error: updateError } = await supabaseClient
        .from('orders')
        .update({ prompts: JSON.stringify(prompts) })
        .eq('tune_id', tune_id)

      if (updateError) {
        console.error('Failed to update order with prompts:', updateError)
        throw new Error(`Failed to update order: ${updateError.message}`)
      }

      // Send a request to Astria to generate images for each prompt
      const promptResponses = await Promise.all(
        prompts.map(async (promptText) => {
          const response = await fetch(`https://api.astria.ai/tunes/${tune_id}/prompts`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${Deno.env.get('ASTRIA_API_KEY')}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              text: promptText,
              num_images: 4
            })
          })

          if (!response.ok) {
            const errorText = await response.text()
            console.error('Astria API prompt error:', response.status, errorText)
            throw new Error(`Astria API prompt error: ${response.statusText} - ${errorText}`)
          }

          return response.json()
        })
      )

      console.log('Astria API prompt responses:', JSON.stringify(promptResponses, null, 2))

      return new Response(
        JSON.stringify({ message: 'Prompts submitted successfully', promptResponses }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Check if this is the second callback (images generated)
    if (body.prompt_id && body.output && body.status === 'completed') {
      const { prompt_id, output, status } = body
      console.log('Received images generated callback:', { prompt_id, output, status })

      // Fetch the order associated with the tune_id (we need to find the tune_id first)
      const { data: promptData, error: promptError } = await supabaseClient
        .from('orders')
        .select('tune_id')
        .eq('prompts', JSON.stringify(body.prompts)) // This is a simplification; in a real scenario, we might need a better way to link prompt_id to tune_id
        .single()

      if (promptError || !promptData) {
        console.error('Prompt not found in orders:', promptError)
        return new Response(
          JSON.stringify({ error: 'Prompt not found in orders' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        )
      }

      const tune_id = promptData.tune_id

      // Fetch the order
      const { data: order, error: fetchError } = await supabaseClient
        .from('orders')
        .select('*')
        .eq('tune_id', tune_id)
        .single()

      if (fetchError || !order) {
        console.error('Order not found:', fetchError)
        return new Response(
          JSON.stringify({ error: 'Order not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        )
      }

      // Update the order with the result URLs
      const { error: updateError } = await supabaseClient
        .from('orders')
        .update({
          result_urls: output,
          status: 'completed'
        })
        .eq('tune_id', tune_id)

      if (updateError) {
        console.error('Failed to update order:', updateError)
        throw new Error(`Failed to update order: ${updateError.message}`)
      }

      // Send email to the user
      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'noreply@yourdomain.com',
          to: order.email,
          subject: 'Your AI Images Are Ready!',
          html: `
            <h1>Your AI Images Are Ready!</h1>
            <p>Here are your generated images:</p>
            <ul>
              ${output.map((url: string) => `<li><a href="${url}">${url}</a></li>`).join('')}
            </ul>
          `
        })
      })

      if (!emailResponse.ok) {
        const errorText = await emailResponse.text()
        console.error('Failed to send email:', emailResponse.status, errorText)
        throw new Error(`Failed to send email: ${emailResponse.statusText} - ${errorText}`)
      }

      console.log('Email sent successfully to:', order.email)

      return new Response(
        JSON.stringify({ message: 'Images processed and email sent successfully' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid callback payload' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in training-done:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})