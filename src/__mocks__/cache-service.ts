const mockCacheService = {
  initRedisCache: jest.fn().mockResolvedValue(undefined),
  getValue: jest.fn().mockResolvedValue(null),
  setValue: jest.fn().mockResolvedValue(undefined),
  getApiResponseFromCache: jest.fn().mockResolvedValue(null),
  updateFetchedMoviesByUser: jest.fn().mockResolvedValue(undefined),
  getFetchedMoviesByUser: jest.fn().mockResolvedValue([]),
  hasKey: jest.fn().mockResolvedValue(false),
  getAllCategoryKeys: jest.fn().mockResolvedValue([]),
  tryGetApiData: jest.fn().mockImplementation((key, fallback) => fallback())
}

export default mockCacheService