import { fetchGoogleNews } from '../mockApi.js'
import countryList from 'react-select-country-list'

describe('Country News API Tests', () => {
  const TEST_TIMEOUT = 10000
  const POPULAR_COUNTRIES = ['us', 'gb', 'ca', 'au', 'de', 'fr', 'jp', 'in', 'br']
  
  test('Global news should work', async () => {
    const result = await fetchGoogleNews(['technology'], 'global')
    expect(result).toBeDefined()
    expect(result.articles).toBeDefined()
    expect(Array.isArray(result.articles)).toBe(true)
  }, TEST_TIMEOUT)

  test.each(POPULAR_COUNTRIES)('Country %s should return news', async (countryCode) => {
    const result = await fetchGoogleNews(['technology'], countryCode)
    expect(result).toBeDefined()
    expect(result.articles).toBeDefined()
    expect(Array.isArray(result.articles)).toBe(true)
    expect(result.articles.length).toBeGreaterThan(0)
    
    // Log first few article titles to verify country-specific content
    console.log(`Sample articles for ${countryCode}:`)
    result.articles.slice(0, 3).forEach(article => {
      console.log(`- ${article.title}`)
    })
  }, TEST_TIMEOUT)

  test('All countries should be valid format', () => {
    const countries = countryList().getData()
    expect(countries.length).toBeGreaterThan(200)
    
    countries.forEach(country => {
      expect(country.value).toBeDefined()
      expect(country.label).toBeDefined()
      expect(typeof country.value).toBe('string')
      expect(country.value.length).toBe(2)
    })
  })

  test('API should handle invalid country codes gracefully', async () => {
    const result = await fetchGoogleNews(['technology'], 'invalid')
    expect(result).toBeDefined()
  }, TEST_TIMEOUT)
})
