import { timer } from './timer';

const mockContext: MiddlewareContext = {
  client: { name: 'test', userAgent: 'melchett/test' },
  request: { url: 'https://www.bbc.co.uk', method: 'get' }
};

describe('Timer middleware', () => {
  it('should call next function once', async () => {
    // Arrange
    const next = jest.fn();

    // Act
    try {
      await timer()({ ...mockContext }, next);
    } catch (ex) {}

    // Assert
    expect(next).toBeCalledTimes(1);
  });

  it('should set start time on initial call', async () => {
    // Arrange
    const next = () => Promise.reject();
    const context = { ...mockContext };

    // Act
    try {
      await timer()(context, next);
    } catch (ex) {}

    // Assert
    expect(typeof context.time.start).toBe('number');
    expect(context.time.elapsed).toBe(undefined);
  });

  it('should set end and elapsed time on Promise resolution', async () => {
    // Arrange
    const next = jest.fn();
    const context = { ...mockContext };

    // Act
    try {
      await timer()(context, next);
    } catch (ex) {}

    // Assert
    expect(typeof context.time.end).toBe('number');
    expect(typeof context.time.elapsed).toBe('number');
  });

  it('should prefer elapsed time from response header', async () => {
    // Arrange
    const next = jest.fn();
    const context = {
      ...mockContext,
      response: {
        headers: {
          'x-response-time': '23.4'
        }
      }
    };

    // Act
    try {
      await timer('x-response-time')(context, next);
    } catch (ex) {}

    // Assert
    expect(context.time.elapsed).toBe(23.4);
  });

  it('should reject with ETIMEDOUT when connection aborted', async () => {
    // Arrange
    const next = jest.fn();

    const errorResult = {
      error_name: 'ETIMEDOUT',
      error_message: 'Timeout exceeded',
    };

    // Assert
    await expect(timer()({ ...mockContext, error: { code: 'ECONNABORTED' } }, next)).rejects.toMatchObject({
      error: errorResult
    });
  });
});