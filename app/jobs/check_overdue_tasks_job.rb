class CheckOverdueTasksJob < ApplicationJob
  queue_as :default

  def perform
    overdue_tasks = Task.where("due_date < ?", Date.current)
                        .where.not(status: [:done, :overdue])

    count = overdue_tasks.count
    overdue_tasks.update_all(status: :overdue, updated_at: Time.current)

    Rails.logger.info "CheckOverdueTasksJob: Marked #{count} tasks as overdue"
  end
end
