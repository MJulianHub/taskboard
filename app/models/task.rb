class Task < ApplicationRecord
  belongs_to :project
  belongs_to :user

  enum :status, [ :pending, :in_progress, :done, :overdue ]

  before_save :check_deadline

  scope :overdue, -> { where(status: :overdue) }

  private

  def check_deadline
    return if done? || overdue?
    return if due_date.blank?

    if due_date < Date.current
      self.status = :overdue
    end
  end
end
