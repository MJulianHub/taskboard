namespace :tasks do
  desc "Mark overdue tasks based on due_date"
  task mark_overdue: :environment do
    overdue_tasks = Task.where("due_date < ?", Date.current)
                        .where.not(status: [:done, :overdue])

    count = overdue_tasks.count
    overdue_tasks.update_all(status: :overdue)

    puts "Marked #{count} task(s) as overdue"
  end
end
