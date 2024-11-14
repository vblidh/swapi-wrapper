const mockCacheService = {
  initRedisCache: jest.fn().mockResolvedValue(undefined),
  setValue: jest.fn().mockResolvedValue(undefined),
  getApiResponseFromCache: jest.fn().mockResolvedValue(null),
  hasKey: jest.fn().mockResolvedValue(false),
  getAllCategoryKeys: jest.fn().mockResolvedValue([]),
  tryGetApiData: jest.fn().mockImplementation((key, fallback) => fallback())
}

export default mockCacheService