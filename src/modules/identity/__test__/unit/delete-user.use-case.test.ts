import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DeleteUserUseCase } from '@/modules/identity/application/users/use-cases/delete-user.use-case'
import { IUserRepository } from '@/modules/identity/domain/repositories/user.repository.interface'
import { UserId } from '@/modules/identity/domain/value-objects/user-id.vo'
import { Result } from '@/lib/result/result'
import { ValidationError } from '@/modules/common/errors/domain/validation.error'
import { NotFoundError } from '@/modules/common/errors/not-found.error'

describe('DeleteUserUseCase', () => {
  let useCase: DeleteUserUseCase
  let mockUserRepository: IUserRepository

  beforeEach(() => {
    mockUserRepository = {
      findById: vi.fn(),
      findByEmail: vi.fn(),
      findAll: vi.fn(),
      existsByEmail: vi.fn(),
      existsById: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn()
    }

    useCase = new DeleteUserUseCase(mockUserRepository)
  })

  it('should fail when user ID is invalid', async () => {
    const result = await useCase.execute('invalid-id')

    expect(result.isSuccess()).toBe(false)
    expect(result.error).toBeInstanceOf(ValidationError)
    expect((result.error as ValidationError).field).toBe('userId')
    expect(mockUserRepository.delete).not.toHaveBeenCalled()
  })

  it('should return NotFoundError when user does not exist', async () => {
    const userId = UserId.create().getValue()
    vi.mocked(mockUserRepository.delete).mockResolvedValue(Result.ok(false))

    const result = await useCase.execute(userId)

    expect(result.isSuccess()).toBe(false)
    expect(result.error).toBeInstanceOf(NotFoundError)
  })

  it('should succeed when user is deleted', async () => {
    const userId = UserId.create().getValue()
    vi.mocked(mockUserRepository.delete).mockResolvedValue(Result.ok(true))

    const result = await useCase.execute(userId)

    expect(result.isSuccess()).toBe(true)
  })
})
