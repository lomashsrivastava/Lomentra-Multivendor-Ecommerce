// Native fetch is available globally in Node.js 18+

const MODEL_NAME = 'gemini-2.5-flash' // Standard high-speed, cost-effective model

/**
 * Helper to call the Google Gemini API with JSON schema enforcement.
 */
async function callGemini(prompt: string, responseSchema?: object): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey || apiKey === 'mock_key_or_placeholder' || apiKey.startsWith('YOUR_')) {
    throw new Error('MISSING_API_KEY')
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${apiKey}`

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: responseSchema ? 'application/json' : 'text/plain',
      ...(responseSchema ? { responseSchema } : {}),
    },
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.warn(`Gemini API responded with status ${res.status}:`, errText)
      throw new Error(`API_RESPONSE_ERROR_${res.status}`)
    }

    const data = (await res.json()) as any
    const contentText = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!contentText) {
      throw new Error('EMPTY_GEMINI_RESPONSE')
    }

    return contentText
  } catch (error) {
    console.error('Error calling Gemini API:', error)
    throw error
  }
}

/**
 * Phase 27: AI Merchant Assistant - Generate Product Listing
 */
export async function generateProductDetails(userInput: string) {
  const prompt = `
    You are an expert e-commerce catalog optimizer.
    Based on the following merchant prompt: "${userInput}", generate an optimized, high-converting product listing.
    The response must follow the requested JSON schema. Include an SEO-optimized product title, a rich marketing description, a suggested category, a suggested price, and search keywords.
    Also perform a Content Moderation check: set "sfw" to false if the prompt contains hate speech, explicit content, illegal references, or offensive slurs, otherwise set it to true.
  `

  const schema = {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'SEO-optimized catchy product name' },
      description: { type: 'string', description: 'Rich markdown-formatted product description' },
      category: { type: 'string', description: 'Suggested category (e.g. electronics, apparel, home, beauty)' },
      price: { type: 'number', description: 'Suggested pricing' },
      tags: {
        type: 'array',
        items: { type: 'string' },
        description: '5 high-impact search keywords/tags',
      },
      sfw: {
        type: 'boolean',
        description: 'True if content is safe and professional, False if offensive or spammy',
      },
    },
    required: ['name', 'description', 'category', 'price', 'tags', 'sfw'],
  }

  try {
    const jsonText = await callGemini(prompt, schema)
    return JSON.parse(jsonText)
  } catch (err) {
    // Fallback Mock Generator
    console.log('Using simulated AI generator fallback for product creation.')

    const lowercaseInput = userInput.toLowerCase()
    let name = 'Premium Eco-Friendly Tech Gear'
    let category = 'electronics'
    let price = 49.99
    let tags = ['eco-friendly', 'tech', 'accessories', 'gadget', 'modern']
    let description = `Introducing the ultimate lifestyle accessory. Engineered from premium, sustainably sourced components, this product delivers peak performance while supporting environmental protection. Featuring a sleek, minimalist aesthetic, it is perfect for everyday use.`

    if (lowercaseInput.includes('tshirt') || lowercaseInput.includes('shirt') || lowercaseInput.includes('hoodie') || lowercaseInput.includes('wear')) {
      name = 'Ultra-Soft Organic Cotton Graphic Tee'
      category = 'apparel'
      price = 24.99
      tags = ['clothing', 'organic cotton', 'streetwear', 'apparel', 'tshirt']
      description = `Crafted from 100% certified organic cotton, this t-shirt offers unparalleled comfort and breathability. Double-stitched seams ensure long-lasting durability, and the vibrant modern graphic print remains crisp wash after wash. Elevate your everyday style effortlessly.`
    } else if (lowercaseInput.includes('bottle') || lowercaseInput.includes('cup') || lowercaseInput.includes('flask')) {
      name = 'Vacuum Insulated Stainless Steel Flask (750ml)'
      category = 'home'
      price = 19.99
      tags = ['bottle', 'insulated', 'hydro', 'home & kitchen', 'stainless steel']
      description = `Keep your drinks ice-cold for 24 hours or piping hot for 12 hours. Featuring double-wall vacuum insulation and a leak-proof food-grade lid, this flask is built for rugged commutes, outdoor trails, and desk setups alike.`
    } else if (lowercaseInput.includes('headphone') || lowercaseInput.includes('earbud') || lowercaseInput.includes('audio')) {
      name = 'Noise-Cancelling Wireless Audio Earbuds'
      category = 'electronics'
      price = 89.99
      tags = ['audio', 'wireless', 'earbuds', 'noise-cancelling', 'music']
      description = `Immerse yourself in premium studio sound. Featuring advanced Active Noise Cancellation (ANC), Bluetooth 5.3 instant connectivity, and a battery life extending up to 30 hours with the case, these earbuds are designed for pure acoustic bliss.`
    }

    // Simple SFW check simulation
    const isOffensive =
      lowercaseInput.includes('kill') ||
      lowercaseInput.includes('spam') ||
      lowercaseInput.includes('scam') ||
      lowercaseInput.includes('badword')

    return {
      name: `[AI] ${name}`,
      description,
      category,
      price,
      tags,
      sfw: !isOffensive,
    }
  }
}

/**
 * Phase 28: AI Customer Reviews Summary
 */
export async function generateReviewSummary(reviews: Array<{ rating: number; comment: string }>) {
  if (reviews.length === 0) {
    return {
      pros: ['No reviews available yet.'],
      cons: ['No reviews available yet.'],
      sentiment: 50,
      summary: 'Not enough data to summarize product reviews.',
    }
  }

  const reviewsText = reviews
    .map((r, i) => `Review ${i + 1} (${r.rating}/5 stars): "${r.comment}"`)
    .join('\n')

  const prompt = `
    Analyze the following customer reviews for a product:
    
    ${reviewsText}
    
    Generate a JSON response summarizing the feedback. Highlight key positives (pros), negatives or areas of concern (cons), a calculated sentiment percentage score (0 = extremely negative, 100 = extremely positive), and a brief overall summary paragraph.
  `

  const schema = {
    type: 'object',
    properties: {
      pros: { type: 'array', items: { type: 'string' }, description: 'Top 3 positive points mentioned' },
      cons: { type: 'array', items: { type: 'string' }, description: 'Top 3 critical/improvement points' },
      sentiment: { type: 'number', description: 'Percentage score from 0 to 100 representing positive bias' },
      summary: { type: 'string', description: '2-sentence overview of customer satisfaction' },
    },
    required: ['pros', 'cons', 'sentiment', 'summary'],
  }

  try {
    const jsonText = await callGemini(prompt, schema)
    return JSON.parse(jsonText)
  } catch (err) {
    console.log('Using simulated AI generator fallback for review summaries.')

    // Calculate mock ratings stats
    const average = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    const sentiment = Math.round((average / 5) * 100)

    const pros = [
      'Customers praise the premium build quality.',
      'Sleek design fits nicely into modern lifestyles.',
      'Very fast delivery and secure packaging.',
    ]

    const cons = [
      reviews.length > 2 ? 'A few users mentioned the price is slightly premium.' : 'No major negative complaints reported.',
      'Instruction manual could have more detail.',
    ]

    return {
      pros,
      cons,
      sentiment,
      summary: `Overall, customers rate this product highly, resulting in a positive sentiment rating of ${sentiment}%. The premium materials and aesthetic design are frequently highlighted, though some users note the premium cost.`,
    }
  }
}

/**
 * Phase 29: AI Chatbot Shopping Assistant
 */
export async function generateChatResponse(
  userMessage: string,
  catalogContext: Array<{ id: string; name: string; description: string; price: number; slug: string; category: string }>
) {
  const catalogText = catalogContext
    .map((p) => `- ID: ${p.id}, Name: ${p.name}, Price: $${p.price}, Description: ${p.description}`)
    .join('\n')

  const prompt = `
    You are "Antigravity Shopping Assistant", a friendly AI chatbot for a multi-vendor marketplace.
    The customer asks: "${userMessage}"
    
    Available Catalog Products Context:
    ${catalogText || 'No products available.'}
    
    Recommend appropriate products if they match the query. Formulate a friendly, conversational response.
    Return your response strictly in the JSON format requested. Under "recommendedProductIds", include the IDs of the products you suggested.
  `

  const schema = {
    type: 'object',
    properties: {
      reply: { type: 'string', description: 'Conversational response to the user' },
      recommendedProductIds: {
        type: 'array',
        items: { type: 'string' },
        description: 'IDs of catalog products mentioned',
      },
    },
    required: ['reply', 'recommendedProductIds'],
  }

  try {
    const jsonText = await callGemini(prompt, schema)
    return JSON.parse(jsonText)
  } catch (err) {
    console.log('Using simulated AI chatbot fallback.')

    const msg = userMessage.toLowerCase()
    let reply = `Hello! I am your Antigravity Shopping Assistant. How can I help you navigate our multi-vendor marketplace today?`
    let recommendedProductIds: string[] = []

    // Search catalog context for simple keyword match
    const matches = catalogContext.filter(
      (p) =>
        p.name.toLowerCase().includes(msg) ||
        p.description.toLowerCase().includes(msg)
    )

    if (matches.length > 0) {
      reply = `I found some great products that match your request! I highly recommend checking out: ${matches
        .map((m) => `"${m.name}" ($${m.price})`)
        .join(', ')}. Let me know if you would like me to add them to your cart!`
      recommendedProductIds = matches.map((m) => m.id)
    } else if (msg.includes('tshirt') || msg.includes('shirt') || msg.includes('wear')) {
      const tshirt = catalogContext.find((p) => p.category === 'apparel')
      if (tshirt) {
        reply = `Looking for clothes? Check out the "${tshirt.name}" priced at just $${tshirt.price}! It has organic materials and looks very trendy.`
        recommendedProductIds = [tshirt.id]
      } else {
        reply = `We have a wide range of custom clothing listed by our merchants, but it looks like we are currently out of apparel listings. Let me know if you want to look at other categories!`
      }
    } else if (msg.includes('hi') || msg.includes('hello') || msg.includes('hey')) {
      reply = `Hi there! I am here to help you shop. Ask me to find products like electronics, apparel, or kitchenware!`
    } else {
      // Default to suggesting first couple products
      if (catalogContext.length > 0) {
        reply = `I'm not completely sure about that request, but you might love our popular listings like "${catalogContext[0].name}" ($${catalogContext[0].price})!`
        recommendedProductIds = [catalogContext[0].id]
      }
    }

    return {
      reply,
      recommendedProductIds,
    }
  }
}
