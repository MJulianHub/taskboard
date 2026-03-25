Rails.application.routes.draw do
  devise_for :users, controllers: { sessions: "users/sessions" }

  resources :projects do
    resources :tasks, only: [ :index, :create, :update ]
  end

  # root "projects#index"
end
