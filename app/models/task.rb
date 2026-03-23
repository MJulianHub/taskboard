class Task < ApplicationRecord
  belongs_to :project
  belongs_to :user

  enum :status, [:pending, :in_progress, :done]
end
